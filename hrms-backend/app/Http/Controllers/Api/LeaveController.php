<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Leave\LeaveListRequest;
use App\Http\Requests\Leave\RejectLeaveRequest;
use App\Http\Requests\Leave\StoreLeaveRequest;
use App\Models\Employee;
use App\Models\LeavePolicy;
use App\Models\LeaveRequest;
use App\Services\LeaveDayCalculator;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Leave management on top of the existing `leave_requests` table.
 *
 * Domain facts taken from the schema (no allocation, holiday or half-day
 * columns exist):
 *  - leave_type holds the code of an active leave policy;
 *  - lifecycle is pending -> approved | rejected | cancelled;
 *  - total_days = days in range minus the employee's weekly-off days;
 *  - approved_by/approved_at record the reviewer for both approve and reject,
 *    rejection_reason holds the reviewer's remarks on rejection.
 */
class LeaveController extends Controller
{
    private const ACTIVE_STATUSES = ['pending', 'approved'];

    public function __construct(private readonly LeaveDayCalculator $days) {}

    /** Active leave policies the employee can apply against. */
    public function types(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => LeavePolicy::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }

    /**
     * Derived usage per leave type for a calendar year (by start date).
     * The leave policy master stores no entitlement, so `allocated` and
     * `available` are null rather than invented.
     */
    public function balance(LeaveListRequest $request): JsonResponse
    {
        $employee = $this->currentEmployee($request);
        $year = $request->filled('year') ? $request->integer('year') : (int) now()->format('Y');

        $totals = LeaveRequest::query()
            ->where('employee_id', $employee->id)
            ->whereIn('status', self::ACTIVE_STATUSES)
            ->whereYear('start_date', $year)
            ->selectRaw('leave_type, status, SUM(total_days) as days')
            ->groupBy('leave_type', 'status')
            ->get()
            ->groupBy('leave_type');

        $policies = LeavePolicy::withTrashed()
            ->where(fn ($q) => $q->where(fn ($active) => $active->where('is_active', true)->whereNull('deleted_at'))
                ->orWhereIn('code', $totals->keys()->all()))
            ->orderBy('name')
            ->get(['name', 'code']);

        $types = $policies->map(function ($policy) use ($totals) {
            $rows = $totals->get($policy->code, collect());

            return [
                'leave_type' => $policy->code,
                'name' => $policy->name,
                'allocated' => null,
                'used' => (float) ($rows->firstWhere('status', 'approved')->days ?? 0),
                'pending' => (float) ($rows->firstWhere('status', 'pending')->days ?? 0),
                'available' => null,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'year' => $year,
                'allocation_configured' => false,
                'types' => $types,
            ],
        ]);
    }

    /** The authenticated employee's own requests. */
    public function index(LeaveListRequest $request): JsonResponse
    {
        $employee = $this->currentEmployee($request);

        $query = LeaveRequest::with('approver:id,name')->where('employee_id', $employee->id);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderByDesc('created_at')->paginate($request->integer('per_page', 20)),
        ]);
    }

    public function store(StoreLeaveRequest $request): JsonResponse
    {
        $employee = $this->currentEmployee($request);

        // The employee is always the authenticated user's own record.
        if ($request->filled('employee_id') && $request->integer('employee_id') !== $employee->id) {
            abort(403, 'You can only apply for leave on your own behalf.');
        }

        if ($employee->employment_status !== 'Active') {
            throw ValidationException::withMessages([
                'employee' => ['Only active employees can apply for leave.'],
            ]);
        }

        $from = Carbon::createFromFormat('Y-m-d', $request->string('start_date')->toString())->startOfDay();
        $to = Carbon::createFromFormat('Y-m-d', $request->string('end_date')->toString())->startOfDay();

        if ($from->diffInDays($to) >= LeaveDayCalculator::MAX_RANGE_DAYS) {
            throw ValidationException::withMessages([
                'end_date' => ['A leave request cannot span more than '.LeaveDayCalculator::MAX_RANGE_DAYS.' days.'],
            ]);
        }

        $totalDays = $this->days->countWorkingDays($this->days->weeklyOffDays($employee), $from, $to);

        if ($totalDays === 0) {
            throw ValidationException::withMessages([
                'start_date' => ['The selected dates fall entirely on weekly offs, so no leave is needed.'],
            ]);
        }

        $leave = DB::transaction(function () use ($request, $employee, $from, $to, $totalDays) {
            // Serialise this employee's submissions so two concurrent requests
            // cannot both pass the overlap check.
            Employee::whereKey($employee->id)->lockForUpdate()->first();

            $overlap = LeaveRequest::where('employee_id', $employee->id)
                ->whereIn('status', self::ACTIVE_STATUSES)
                ->whereDate('start_date', '<=', $to->toDateString())
                ->whereDate('end_date', '>=', $from->toDateString())
                ->exists();

            if ($overlap) {
                throw ValidationException::withMessages([
                    'start_date' => ['These dates overlap an existing pending or approved leave request.'],
                ]);
            }

            return LeaveRequest::create([
                'employee_id' => $employee->id,
                'leave_type' => $request->string('leave_type')->toString(),
                'start_date' => $from->toDateString(),
                'end_date' => $to->toDateString(),
                'total_days' => $totalDays,
                'reason' => $request->string('reason')->toString(),
                'status' => 'pending',
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Leave request submitted successfully.',
            'data' => $leave->fresh(),
        ], 201);
    }

    public function show(Request $request, LeaveRequest $leave): JsonResponse
    {
        if (! $this->isOwner($request, $leave) && ! $this->isReviewer($request)) {
            abort(403, 'You cannot view this leave request.');
        }

        return response()->json([
            'success' => true,
            'data' => $leave->load(['employee:id,employee_code,first_name,last_name,department_id', 'employee.department:id,name', 'approver:id,name']),
        ]);
    }

    public function cancel(Request $request, LeaveRequest $leave): JsonResponse
    {
        if (! $this->isOwner($request, $leave)) {
            abort(403, 'You cannot cancel this leave request.');
        }

        $leave = DB::transaction(function () use ($leave) {
            $locked = LeaveRequest::whereKey($leave->id)->lockForUpdate()->firstOrFail();

            if ($locked->status === 'approved') {
                throw ValidationException::withMessages([
                    'status' => ['Approved leave cannot be cancelled here. Contact your reviewer.'],
                ]);
            }

            if ($locked->status !== 'pending') {
                throw ValidationException::withMessages([
                    'status' => ['Only pending leave requests can be cancelled.'],
                ]);
            }

            $locked->update(['status' => 'cancelled']);

            return $locked;
        });

        return response()->json([
            'success' => true,
            'message' => 'Leave request cancelled successfully.',
            'data' => $leave->fresh(),
        ]);
    }

    /** Reviewer list across all employees. */
    public function adminIndex(LeaveListRequest $request): JsonResponse
    {
        $query = LeaveRequest::with(['employee:id,employee_code,first_name,last_name,department_id', 'employee.department:id,name', 'approver:id,name']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('leave_type')) {
            $query->where('leave_type', $request->string('leave_type')->toString());
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->integer('employee_id'));
        }

        if ($request->filled('department_id')) {
            $query->whereHas('employee', fn ($q) => $q->where('department_id', $request->integer('department_id')));
        }

        // Requests overlapping the [from_date, to_date] window.
        if ($request->filled('from_date')) {
            $query->whereDate('end_date', '>=', $request->string('from_date')->toString());
        }

        if ($request->filled('to_date')) {
            $query->whereDate('start_date', '<=', $request->string('to_date')->toString());
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderByDesc('created_at')->paginate($request->integer('per_page', 20)),
        ]);
    }

    public function approve(Request $request, LeaveRequest $leave): JsonResponse
    {
        $this->guardReviewer($request, $leave);

        $leave = $this->review($leave, $request->user('api')->id, 'approved', null);

        return response()->json([
            'success' => true,
            'message' => 'Leave request approved successfully.',
            'data' => $leave,
        ]);
    }

    public function reject(RejectLeaveRequest $request, LeaveRequest $leave): JsonResponse
    {
        $this->guardReviewer($request, $leave);

        $leave = $this->review($leave, $request->user('api')->id, 'rejected', $request->string('rejection_reason')->toString());

        return response()->json([
            'success' => true,
            'message' => 'Leave request rejected successfully.',
            'data' => $leave,
        ]);
    }

    /**
     * Pending -> approved|rejected inside one transaction. The row is locked so
     * a second reviewer acting on the same request sees the new status and
     * gets a 422 instead of overwriting the first decision.
     */
    private function review(LeaveRequest $leave, int $reviewerId, string $status, ?string $remarks): LeaveRequest
    {
        return DB::transaction(function () use ($leave, $reviewerId, $status, $remarks) {
            $locked = LeaveRequest::whereKey($leave->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== 'pending') {
                throw ValidationException::withMessages([
                    'status' => ['Only pending leave requests can be '.$status.'.'],
                ]);
            }

            $locked->update([
                'status' => $status,
                'approved_by' => $reviewerId,
                'approved_at' => now(),
                'rejection_reason' => $remarks,
            ]);

            return $locked->fresh()->load(['employee:id,employee_code,first_name,last_name,department_id', 'approver:id,name']);
        });
    }

    private function guardReviewer(Request $request, LeaveRequest $leave): void
    {
        // Nobody may decide their own request, whatever their permissions.
        if ($this->isOwner($request, $leave)) {
            abort(403, 'You cannot review your own leave request.');
        }
    }

    private function currentEmployee(Request $request): Employee
    {
        $employee = Employee::where('user_id', $request->user('api')->id)->first();

        if (! $employee) {
            abort(404, 'Employee profile not found.');
        }

        return $employee;
    }

    private function isOwner(Request $request, LeaveRequest $leave): bool
    {
        return Employee::where('user_id', $request->user('api')->id)
            ->where('id', $leave->employee_id)
            ->exists();
    }

    private function isReviewer(Request $request): bool
    {
        $user = $request->user('api');

        return $user->can('approve leaves') || $user->can('reject leaves');
    }
}
