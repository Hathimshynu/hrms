<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Absence\AbsenceRangeRequest;
use App\Models\Employee;
use App\Services\AbsenceCalculationService;
use App\Services\LeaveDayCalculator;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

/**
 * Absence is derived, never stored. See AbsenceCalculationService for the
 * status rules; holidays are not in the schema so no `holiday` status exists.
 */
class AbsenceController extends Controller
{
    private const MAX_ADMIN_RANGE_DAYS = 62;

    public function __construct(private readonly AbsenceCalculationService $absence) {}

    /** The authenticated employee's own day-by-day status. */
    public function mine(AbsenceRangeRequest $request): JsonResponse
    {
        $employee = Employee::where('user_id', $request->user('api')->id)
            ->first(['id', 'employee_code', 'first_name', 'last_name', 'joining_date', 'employment_status']);

        if (! $employee) {
            abort(404, 'Employee profile not found.');
        }

        [$from, $to] = $this->range($request, LeaveDayCalculator::MAX_RANGE_DAYS);

        $rows = $this->absence->calculate(collect([$employee]), $from, $to);

        return response()->json([
            'success' => true,
            'data' => [
                'employee' => $this->employeeSummary($employee),
                'from_date' => $from->toDateString(),
                'to_date' => $to->toDateString(),
                'holiday_supported' => false,
                'summary' => $this->summary($rows),
                'days' => $rows->map(fn ($r) => [
                    'date' => $r['date'],
                    'status' => $r['status'],
                    'pending_leave' => $r['pending_leave'],
                ])->values(),
            ],
        ]);
    }

    /**
     * Reviewer view across active employees. Rows are employee-days filtered
     * by status (default: absent) and paginated.
     */
    public function adminIndex(AbsenceRangeRequest $request): JsonResponse
    {
        [$from, $to] = $this->range($request, self::MAX_ADMIN_RANGE_DAYS);

        // Inactive/onboarding/terminated employees are never counted as absent.
        $employees = Employee::query()
            ->where('employment_status', 'Active')
            ->when($request->filled('employee_id'), fn ($q) => $q->where('id', $request->integer('employee_id')))
            ->when($request->filled('department_id'), fn ($q) => $q->where('department_id', $request->integer('department_id')))
            ->with('department:id,name')
            ->get(['id', 'employee_code', 'first_name', 'last_name', 'department_id', 'joining_date']);

        $rows = $this->absence->calculate($employees, $from, $to);
        $summary = $this->summary($rows);

        $status = $request->filled('status') ? $request->string('status')->toString() : 'absent';
        $byEmployee = $employees->keyBy('id');

        $filtered = $rows->where('status', $status)
            ->sortBy([['date', 'desc'], ['employee_id', 'asc']])
            ->values()
            ->map(function ($r) use ($byEmployee) {
                $employee = $byEmployee[$r['employee_id']];

                return $r + [
                    'employee' => $this->employeeSummary($employee),
                    'department' => $employee->department?->name,
                ];
            });

        $perPage = $request->integer('per_page', 20);
        $page = max(1, $request->integer('page', 1));

        $paginator = new LengthAwarePaginator(
            $filtered->forPage($page, $perPage)->values(),
            $filtered->count(),
            $perPage,
            $page,
        );

        return response()->json([
            'success' => true,
            'data' => [
                'from_date' => $from->toDateString(),
                'to_date' => $to->toDateString(),
                'status' => $status,
                'holiday_supported' => false,
                'summary' => $summary,
                'rows' => $paginator,
            ],
        ]);
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function range(Request $request, int $maxDays): array
    {
        $from = $request->filled('from_date')
            ? Carbon::createFromFormat('Y-m-d', $request->string('from_date')->toString())->startOfDay()
            : now()->startOfMonth();
        $to = $request->filled('to_date')
            ? Carbon::createFromFormat('Y-m-d', $request->string('to_date')->toString())->startOfDay()
            : $from->copy()->endOfMonth()->startOfDay();

        if ($from->diffInDays($to) >= $maxDays) {
            throw ValidationException::withMessages([
                'to_date' => ['The date range cannot exceed '.$maxDays.' days.'],
            ]);
        }

        return [$from, $to];
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $rows
     * @return array<string, int>
     */
    private function summary($rows): array
    {
        $counts = $rows->countBy('status');

        return collect(AbsenceCalculationService::STATUSES)
            ->mapWithKeys(fn ($s) => [$s => (int) ($counts[$s] ?? 0)])
            ->all();
    }

    /** @return array{id:int,employee_code:?string,name:string} */
    private function employeeSummary(Employee $employee): array
    {
        return [
            'id' => $employee->id,
            'employee_code' => $employee->employee_code,
            'name' => trim($employee->first_name.' '.$employee->last_name),
        ];
    }
}
