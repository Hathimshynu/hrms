<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LeaveEntitlement\LeaveEntitlementListRequest;
use App\Http\Requests\LeaveEntitlement\StoreLeaveEntitlementRequest;
use App\Http\Requests\LeaveEntitlement\UpdateLeaveEntitlementRequest;
use App\Models\Department;
use App\Models\Employee;
use App\Models\LeaveEntitlement;
use App\Models\LeavePolicy;
use App\Services\LeaveEntitlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Manual leave entitlement allocation per employee, leave type and calendar
 * year. Every route is behind a `* leave entitlements` permission that
 * ordinary employees do not hold; employees see only their own balance
 * through GET /api/leaves/balance.
 */
class LeaveEntitlementController extends Controller
{
    public function __construct(private readonly LeaveEntitlementService $entitlements) {}

    public function index(LeaveEntitlementListRequest $request): JsonResponse
    {
        $query = LeaveEntitlement::query()->with([
            'employee:id,employee_code,first_name,last_name,department_id',
            'employee.department:id,name',
            'leavePolicy:id,name,code',
        ]);

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->integer('employee_id'));
        }

        if ($request->filled('leave_policy_id')) {
            $query->where('leave_policy_id', $request->integer('leave_policy_id'));
        }

        if ($request->filled('year')) {
            $query->where('leave_year', $request->integer('year'));
        }

        if ($request->filled('department_id')) {
            $query->whereHas('employee', fn ($q) => $q->where('department_id', $request->integer('department_id')));
        }

        if ($request->filled('search')) {
            $term = '%'.addcslashes($request->string('search')->toString(), '%_\\').'%';
            $query->whereHas('employee', fn ($q) => $q->where(fn ($w) => $w
                ->where('employee_code', 'like', $term)
                ->orWhere('first_name', 'like', $term)
                ->orWhere('last_name', 'like', $term)
                ->orWhereRaw("CONCAT(first_name, ' ', last_name) like ?", [$term])));
        }

        $sortBy = $request->filled('sort_by') ? $request->string('sort_by')->toString() : 'leave_year';
        $sortDir = $request->string('sort_dir')->toString() === 'asc' ? 'asc' : 'desc';

        $page = $query->orderBy($sortBy, $sortDir)->orderByDesc('id')->paginate($request->integer('per_page', 20));

        $usage = $this->entitlements->usage(
            $page->getCollection()->pluck('employee_id')->unique()->values()->all(),
            $page->getCollection()->pluck('leave_year')->unique()->values()->all(),
        );

        $page->through(fn (LeaveEntitlement $e) => $this->present($e, $usage));

        return response()->json(['success' => true, 'data' => $page]);
    }

    public function show(LeaveEntitlement $leaveEntitlement): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->presentOne($leaveEntitlement)]);
    }

    public function store(StoreLeaveEntitlementRequest $request): JsonResponse
    {
        $policy = LeavePolicy::findOrFail($request->integer('leave_policy_id'));
        $employeeId = $request->integer('employee_id');
        $year = $request->integer('leave_year');
        $days = (float) $request->string('entitled_days')->toString();

        $entitlement = DB::transaction(function () use ($request, $policy, $employeeId, $year, $days) {
            // Serialise per employee so the approved-days check and the insert see the same state.
            Employee::whereKey($employeeId)->lockForUpdate()->first();

            $this->entitlements->assertEntitledDaysCoverApproved($employeeId, $policy->code, $year, $days);

            return LeaveEntitlement::create([
                'employee_id' => $employeeId,
                'leave_policy_id' => $policy->id,
                'leave_year' => $year,
                'entitled_days' => $days,
                'created_by' => $request->user('api')->id,
                'updated_by' => $request->user('api')->id,
            ]);
        });

        Log::info('leave_entitlement.created', ['id' => $entitlement->id, 'by' => $request->user('api')->id]);

        return response()->json([
            'success' => true,
            'message' => 'Leave entitlement created successfully.',
            'data' => $this->presentOne($entitlement),
        ], 201);
    }

    public function update(UpdateLeaveEntitlementRequest $request, LeaveEntitlement $leaveEntitlement): JsonResponse
    {
        $days = (float) $request->string('entitled_days')->toString();

        DB::transaction(function () use ($request, $leaveEntitlement, $days) {
            Employee::whereKey($leaveEntitlement->employee_id)->lockForUpdate()->first();
            $locked = LeaveEntitlement::whereKey($leaveEntitlement->id)->lockForUpdate()->firstOrFail();

            $code = (string) LeavePolicy::withTrashed()->whereKey($locked->leave_policy_id)->value('code');
            $this->entitlements->assertEntitledDaysCoverApproved($locked->employee_id, $code, $locked->leave_year, $days);

            $locked->update(['entitled_days' => $days, 'updated_by' => $request->user('api')->id]);
        });

        Log::info('leave_entitlement.updated', ['id' => $leaveEntitlement->id, 'by' => $request->user('api')->id]);

        return response()->json([
            'success' => true,
            'message' => 'Leave entitlement updated successfully.',
            'data' => $this->presentOne($leaveEntitlement->fresh()),
        ]);
    }

    public function destroy(Request $request, LeaveEntitlement $leaveEntitlement): JsonResponse
    {
        DB::transaction(function () use ($leaveEntitlement) {
            Employee::whereKey($leaveEntitlement->employee_id)->lockForUpdate()->first();
            $locked = LeaveEntitlement::whereKey($leaveEntitlement->id)->lockForUpdate()->firstOrFail();

            $this->entitlements->assertCanDelete($locked);

            $locked->delete();
        });

        Log::info('leave_entitlement.deleted', ['id' => $leaveEntitlement->id, 'by' => $request->user('api')->id]);

        return response()->json(['success' => true, 'message' => 'Leave entitlement deleted successfully.']);
    }

    /**
     * Pick-lists for the entitlement form and filters. Behind
     * `view leave entitlements` so managing entitlements does not depend on
     * also holding employee/department/leave-policy permissions. Employees are
     * capped at 500 and searchable server-side.
     */
    public function options(Request $request): JsonResponse
    {
        $employees = Employee::query()
            ->where('employment_status', 'Active')
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.addcslashes($request->string('search')->toString(), '%_\\').'%';
                $q->where(fn ($w) => $w->where('employee_code', 'like', $term)
                    ->orWhere('first_name', 'like', $term)
                    ->orWhere('last_name', 'like', $term)
                    ->orWhereRaw("CONCAT(first_name, ' ', last_name) like ?", [$term]));
            })
            ->orderBy('employee_code')
            ->limit(500)
            ->get(['id', 'employee_code', 'first_name', 'last_name', 'department_id'])
            ->map(fn ($e) => [
                'id' => $e->id,
                'employee_code' => $e->employee_code,
                'name' => trim($e->first_name.' '.$e->last_name),
                'department_id' => $e->department_id,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'employees' => $employees,
                'departments' => Department::query()->orderBy('name')->get(['id', 'name']),
                'leave_policies' => LeavePolicy::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']),
            ],
        ]);
    }

    /**
     * @param  array<string, array{approved: float, pending: float}>  $usage
     * @return array<string, mixed>
     */
    private function present(LeaveEntitlement $e, array $usage): array
    {
        $code = $e->leavePolicy?->code;
        $used = $usage[$e->employee_id.'|'.$code.'|'.$e->leave_year] ?? ['approved' => 0.0, 'pending' => 0.0];

        return [
            'id' => $e->id,
            'employee_id' => $e->employee_id,
            'employee_code' => $e->employee?->employee_code,
            'employee_name' => trim(($e->employee?->first_name ?? '').' '.($e->employee?->last_name ?? '')),
            'department_id' => $e->employee?->department_id,
            'department' => $e->employee?->department?->name,
            'leave_policy_id' => $e->leave_policy_id,
            'leave_type' => $code,
            'leave_type_name' => $e->leavePolicy?->name,
            'leave_year' => $e->leave_year,
        ] + $this->entitlements->figures((float) $e->entitled_days, $used['approved'], $used['pending']);
    }

    /** @return array<string, mixed> */
    private function presentOne(LeaveEntitlement $e): array
    {
        $e->load(['employee:id,employee_code,first_name,last_name,department_id', 'employee.department:id,name', 'leavePolicy:id,name,code']);

        return $this->present($e, $this->entitlements->usage([$e->employee_id], [$e->leave_year], $e->leavePolicy?->code));
    }
}
