<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\PayrollListRequest;
use App\Http\Requests\Payroll\PreviewPayrollRequest;
use App\Http\Requests\Payroll\StorePayrollRequest;
use App\Http\Requests\Payroll\UpdatePayrollRequest;
use App\Models\Employee;
use App\Models\Payroll;
use App\Services\PayrollCalculationService;
use App\Support\Export\TabularExport;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Payroll over the existing `payrolls` table.
 *
 * Lifecycle: draft (editable, deletable) -> processed (immutable). The
 * table's `paid` / `cancelled` statuses have no permission or business rule
 * behind them, so they are not reachable through this API.
 *
 * Responses never include bank details or compensation breakdowns beyond the
 * calculated figures, and the amounts on create are always calculated on the
 * server from the employee's compensation.
 */
class PayrollController extends Controller
{
    private const EMPLOYEE_COLUMNS = 'employee:id,employee_code,first_name,last_name,department_id';

    public function __construct(private readonly PayrollCalculationService $calculator) {}

    public function index(PayrollListRequest $request): JsonResponse
    {
        $query = $this->filtered($request);

        // Totals cover the whole filtered set, not just the current page.
        $summary = (clone $query)
            ->reorder()
            ->selectRaw('COUNT(*) as records, COALESCE(SUM(basic_salary),0) as basic, COALESCE(SUM(gross_salary),0) as gross, COALESCE(SUM(total_deductions),0) as deductions, COALESCE(SUM(net_salary),0) as net')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'records' => (int) $summary->records,
                    'basic_salary' => (float) $summary->basic,
                    'gross_salary' => (float) $summary->gross,
                    'total_deductions' => (float) $summary->deductions,
                    'net_salary' => (float) $summary->net,
                ],
                'payrolls' => $query->with([self::EMPLOYEE_COLUMNS, 'employee.department:id,name'])->paginate($request->integer('per_page', 20)),
            ],
        ]);
    }

    /** Same filters as the list, whole dataset, no bank data, `view payroll` only. */
    public function export(PayrollListRequest $request)
    {
        $query = $this->filtered($request)->with([self::EMPLOYEE_COLUMNS, 'employee.department:id,name']);

        $rows = (function () use ($query) {
            foreach ($query->cursor() as $p) {
                yield [
                    $p->employee?->employee_code,
                    trim(($p->employee?->first_name ?? '').' '.($p->employee?->last_name ?? '')),
                    $p->employee?->department?->name,
                    str_pad((string) $p->payroll_month, 2, '0', STR_PAD_LEFT).'/'.$p->payroll_year,
                    (float) $p->basic_salary,
                    (float) $p->gross_salary,
                    (float) $p->total_deductions,
                    (float) $p->net_salary,
                    ucfirst($p->status),
                    TabularExport::dateTime($p->processed_at),
                ];
            }
        })();

        $period = $request->filled('year')
            ? $request->integer('year').($request->filled('month') ? '-'.str_pad((string) $request->integer('month'), 2, '0', STR_PAD_LEFT) : '')
            : now()->format('Y-m-d');

        return TabularExport::download(
            'payroll-'.$period,
            ['Employee Code', 'Employee', 'Department', 'Month/Year', 'Basic Salary', 'Gross Salary', 'Total Deductions', 'Net Salary', 'Status', 'Processed At'],
            $rows,
            $request->string('format', 'csv')->toString(),
        );
    }

    public function preview(PreviewPayrollRequest $request): JsonResponse
    {
        $employee = Employee::findOrFail($request->integer('employee_id'));

        $figures = $this->calculator->calculate($employee, $request->integer('payroll_month'), $request->integer('payroll_year'));

        return response()->json([
            'success' => true,
            'data' => $figures + [
                'employee' => $this->employeeSummary($employee),
                'existing' => Payroll::where('employee_id', $employee->id)
                    ->where('payroll_month', $request->integer('payroll_month'))
                    ->where('payroll_year', $request->integer('payroll_year'))
                    ->value('id'),
            ],
        ]);
    }

    public function show(Payroll $payroll): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $payroll->load([self::EMPLOYEE_COLUMNS, 'employee.department:id,name']),
        ]);
    }

    public function store(StorePayrollRequest $request): JsonResponse
    {
        $employee = Employee::findOrFail($request->integer('employee_id'));
        $month = $request->integer('payroll_month');
        $year = $request->integer('payroll_year');

        $figures = $this->calculator->calculate($employee, $month, $year);

        try {
            $payroll = DB::transaction(function () use ($employee, $month, $year, $figures) {
                // Serialise creation per employee; the DB unique key is the final guard.
                Employee::whereKey($employee->id)->lockForUpdate()->first();

                if (Payroll::withTrashed()->where('employee_id', $employee->id)->where('payroll_month', $month)->where('payroll_year', $year)->exists()) {
                    throw $this->duplicate();
                }

                return Payroll::create([
                    'employee_id' => $employee->id,
                    'payroll_month' => $month,
                    'payroll_year' => $year,
                    'basic_salary' => $figures['basic_salary'],
                    'gross_salary' => $figures['gross_salary'],
                    'total_deductions' => $figures['total_deductions'],
                    'net_salary' => $figures['net_salary'],
                    'status' => 'draft',
                ]);
            });
        } catch (UniqueConstraintViolationException) {
            throw $this->duplicate();
        }

        return response()->json([
            'success' => true,
            'message' => 'Payroll draft created successfully.',
            'data' => $payroll->load([self::EMPLOYEE_COLUMNS, 'employee.department:id,name']),
        ], 201);
    }

    public function update(UpdatePayrollRequest $request, Payroll $payroll): JsonResponse
    {
        $payroll = DB::transaction(function () use ($request, $payroll) {
            $locked = Payroll::whereKey($payroll->id)->lockForUpdate()->firstOrFail();
            $this->requireDraft($locked, 'edited');

            if ($request->boolean('recalculate')) {
                $figures = $this->calculator->calculate(Employee::findOrFail($locked->employee_id), $locked->payroll_month, $locked->payroll_year);
                $basic = $figures['basic_salary'];
                $gross = $figures['gross_salary'];
                $deductions = $figures['total_deductions'];
            } else {
                $basic = $request->filled('basic_salary') ? round($request->float('basic_salary'), 2) : (float) $locked->basic_salary;
                $gross = $request->filled('gross_salary') ? round($request->float('gross_salary'), 2) : (float) $locked->gross_salary;
                $deductions = $request->filled('total_deductions') ? round($request->float('total_deductions'), 2) : (float) $locked->total_deductions;
            }

            if ($basic > $gross) {
                throw ValidationException::withMessages(['basic_salary' => ['Basic salary cannot exceed gross salary.']]);
            }

            if ($deductions > $gross) {
                throw ValidationException::withMessages(['total_deductions' => ['Deductions cannot exceed gross salary.']]);
            }

            $locked->update([
                'basic_salary' => $basic,
                'gross_salary' => $gross,
                'total_deductions' => $deductions,
                'net_salary' => round($gross - $deductions, 2),
            ]);

            return $locked;
        });

        return response()->json([
            'success' => true,
            'message' => 'Payroll draft updated successfully.',
            'data' => $payroll->fresh()->load([self::EMPLOYEE_COLUMNS, 'employee.department:id,name']),
        ]);
    }

    public function process(Payroll $payroll): JsonResponse
    {
        $payroll = DB::transaction(function () use ($payroll) {
            $locked = Payroll::whereKey($payroll->id)->lockForUpdate()->firstOrFail();
            $this->requireDraft($locked, 'processed');

            $locked->update(['status' => 'processed', 'processed_at' => now()]);

            return $locked;
        });

        return response()->json([
            'success' => true,
            'message' => 'Payroll processed successfully.',
            'data' => $payroll->fresh()->load([self::EMPLOYEE_COLUMNS, 'employee.department:id,name']),
        ]);
    }

    public function destroy(Payroll $payroll): JsonResponse
    {
        DB::transaction(function () use ($payroll) {
            $locked = Payroll::whereKey($payroll->id)->lockForUpdate()->firstOrFail();
            $this->requireDraft($locked, 'deleted');

            // A draft holds no history; removing it fully also frees the
            // employee/month/year unique key for a corrected draft.
            $locked->forceDelete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Payroll draft deleted successfully.',
        ]);
    }

    /** @return Builder<Payroll> */
    private function filtered(PayrollListRequest $request): Builder
    {
        $query = Payroll::query()->orderByDesc('payroll_year')->orderByDesc('payroll_month')->orderByDesc('id');

        if ($request->filled('month')) {
            $query->where('payroll_month', $request->integer('month'));
        }

        if ($request->filled('year')) {
            $query->where('payroll_year', $request->integer('year'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->integer('employee_id'));
        }

        if ($request->filled('department_id')) {
            $query->whereHas('employee', fn ($q) => $q->where('department_id', $request->integer('department_id')));
        }

        if ($request->filled('search')) {
            $term = '%'.$request->string('search')->toString().'%';
            $query->whereHas('employee', fn ($q) => $q->where(fn ($w) => $w
                ->where('first_name', 'like', $term)
                ->orWhere('last_name', 'like', $term)
                ->orWhere('employee_code', 'like', $term)
                ->orWhereRaw("CONCAT(first_name, ' ', last_name) like ?", [$term])));
        }

        return $query;
    }

    private function requireDraft(Payroll $payroll, string $action): void
    {
        if ($payroll->status !== 'draft') {
            throw ValidationException::withMessages([
                'status' => ['Only draft payroll can be '.$action.'. Processed payroll is immutable.'],
            ]);
        }
    }

    private function duplicate(): ValidationException
    {
        return ValidationException::withMessages([
            'employee_id' => ['A payroll record already exists for this employee and month.'],
        ]);
    }

    /** @return array<string, mixed> */
    private function employeeSummary(Employee $employee): array
    {
        return [
            'id' => $employee->id,
            'employee_code' => $employee->employee_code,
            'name' => trim($employee->first_name.' '.$employee->last_name),
        ];
    }
}
