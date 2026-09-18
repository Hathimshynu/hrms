<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Department;
use App\Models\Designation;
use App\Models\Employee;
use App\Models\Location;
use App\Models\LeavePolicy;
use App\Models\AttendancePolicy;
use App\Models\WorkSchedule;
use App\Models\Shift;
use App\Models\WeeklyOff;
use App\Models\LatePolicy;
use App\Models\OvertimePolicy;
use App\Models\OnboardingChecklist;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeMasterController extends Controller
{
    public function branches(Request $request): JsonResponse
    {
        $branches = Branch::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get([
                'id',
                'code',
                'name',
                'city',
                'state',
                'country',
                'created_at',
                'updated_at',
            ]);

        return response()->json([
            'success' => true,
            'data' => $branches,
        ]);
    }

    public function locations(Request $request): JsonResponse
    {
        $query = Location::query()
            ->where('is_active', true);

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->integer('branch_id'));
        }

        $locations = $query
            ->orderBy('name')
            ->get([
                'id',
                'branch_id',
                'code',
                'name',
                'city',
                'state',
                'country',
                'created_at',
                'updated_at',
            ]);

        return response()->json([
            'success' => true,
            'data' => $locations,
        ]);
    }

    public function reportingManagers(Request $request): JsonResponse
    {
        $query = Employee::query()
            ->where('employment_status', 'Active')
            ->orderBy('first_name');

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->integer('department_id'));
        }

        $managers = $query->get([
            'id',
            'employee_code',
            'first_name',
            'last_name',
            'department_id',
            'designation_id',
            'created_at',
            'updated_at',
        ])->map(function ($employee) {
            return [
                'id' => $employee->id,
                'employee_code' => $employee->employee_code,
                'name' => trim($employee->first_name . ' ' . $employee->last_name),
                'department_id' => $employee->department_id,
                'designation_id' => $employee->designation_id,
                'created_at' => $employee->created_at,
                'updated_at' => $employee->updated_at,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $managers,
        ]);
    }

    public function designationsByDepartment(Request $request, Department $department): JsonResponse
    {
        $designations = $department->designations()
        ->where('status', 'Active')
        ->orderBy('name')
        ->get(['id', 'department_id', 'name', 'code']);

        return response()->json([
            'success' => true,
            'data' => $designations,
        ]);
    }

    public function leavePolicies(): JsonResponse
    {
        return $this->masterList(LeavePolicy::class);
    }

    public function attendancePolicies(): JsonResponse
    {
        return $this->masterList(AttendancePolicy::class);
    }

    public function workSchedules(): JsonResponse
    {
        return $this->masterList(WorkSchedule::class);
    }

    public function shifts(): JsonResponse
    {
        return $this->masterList(Shift::class);
    }

    public function weeklyOffs(): JsonResponse
    {
        return $this->masterList(WeeklyOff::class);
    }

    public function latePolicies(): JsonResponse
    {
        return $this->masterList(LatePolicy::class);
    }

    public function overtimePolicies(): JsonResponse
    {
        return $this->masterList(OvertimePolicy::class);
    }

    public function onboardingChecklists(): JsonResponse
    {
        return $this->masterList(OnboardingChecklist::class);
    }

    protected function masterList(string $model): JsonResponse
    {
        $data = $model::query()->where('is_active', true)->orderBy('name')->get();

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function createLeavePolicy(Request $request): JsonResponse
    {
        return $this->masterCreate($request, LeavePolicy::class, ['name', 'code', 'description', 'is_active']);
    }

    public function createAttendancePolicy(Request $request): JsonResponse
    {
        return $this->masterCreate($request, AttendancePolicy::class, ['name', 'code', 'description', 'is_active']);
    }

    public function createWorkSchedule(Request $request): JsonResponse
    {
        return $this->masterCreate($request, WorkSchedule::class, ['name', 'code', 'start_time', 'end_time', 'working_hours', 'description', 'is_active']);
    }

    public function createShift(Request $request): JsonResponse
    {
        return $this->masterCreate($request, Shift::class, ['name', 'code', 'start_time', 'end_time', 'working_hours', 'description', 'is_active']);
    }

    public function createWeeklyOff(Request $request): JsonResponse
    {
        return $this->masterCreate($request, WeeklyOff::class, ['name', 'code', 'days', 'description', 'is_active']);
    }

    public function createLatePolicy(Request $request): JsonResponse
    {
        return $this->masterCreate($request, LatePolicy::class, ['name', 'code', 'grace_minutes', 'max_late_minutes', 'description', 'is_active']);
    }

    public function createOvertimePolicy(Request $request): JsonResponse
    {
        return $this->masterCreate($request, OvertimePolicy::class, ['name', 'code', 'minimum_hours', 'multiplier', 'description', 'is_active']);
    }

    public function createOnboardingChecklist(Request $request): JsonResponse
    {
        return $this->masterCreate($request, OnboardingChecklist::class, ['name', 'code', 'description', 'is_active']);
    }

    protected function masterCreate(Request $request, string $model, array $fields): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => ['required', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i'],
            'working_hours' => ['nullable', 'numeric', 'min:0'],
            'days' => ['nullable', 'array'],
            'grace_minutes' => ['nullable', 'integer', 'min:0'],
            'max_late_minutes' => ['nullable', 'integer', 'min:0'],
            'minimum_hours' => ['nullable', 'numeric', 'min:0'],
            'multiplier' => ['nullable', 'numeric', 'min:0'],
        ]);

        $record = $model::create(array_intersect_key($data, array_flip($fields)));

        return response()->json(['success' => true, 'message' => 'Master record created successfully.', 'data' => $record], 201);
    }

    protected function masterUpdate(Request $request, Model $record, array $fields): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => ['required', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i'],
            'working_hours' => ['nullable', 'numeric', 'min:0'],
            'days' => ['nullable', 'array'],
            'grace_minutes' => ['nullable', 'integer', 'min:0'],
            'max_late_minutes' => ['nullable', 'integer', 'min:0'],
            'minimum_hours' => ['nullable', 'numeric', 'min:0'],
            'multiplier' => ['nullable', 'numeric', 'min:0'],
        ]);

        $record->update(array_intersect_key($data, array_flip($fields)));

        return response()->json(['success' => true, 'message' => 'Master record updated successfully.', 'data' => $record]);
    }

    public function updateLeavePolicy(Request $request, LeavePolicy $leavePolicy): JsonResponse
    {
        return $this->masterUpdate($request, $leavePolicy, ['name', 'code', 'description', 'is_active']);
    }

    public function updateAttendancePolicy(Request $request, AttendancePolicy $attendancePolicy): JsonResponse
    {
        return $this->masterUpdate($request, $attendancePolicy, ['name', 'code', 'description', 'is_active']);
    }

    public function updateWorkSchedule(Request $request, WorkSchedule $workSchedule): JsonResponse
    {
        return $this->masterUpdate($request, $workSchedule, ['name', 'code', 'start_time', 'end_time', 'working_hours', 'description', 'is_active']);
    }

    public function updateShift(Request $request, Shift $shift): JsonResponse
    {
        return $this->masterUpdate($request, $shift, ['name', 'code', 'start_time', 'end_time', 'working_hours', 'description', 'is_active']);
    }
    public function updateWeeklyOff(Request $request, WeeklyOff $weeklyOff): JsonResponse
    {
        return $this->masterUpdate($request, $weeklyOff, ['name', 'code', 'days', 'description', 'is_active']);
    }

    public function updateLatePolicy(Request $request, LatePolicy $latePolicy): JsonResponse
    {
        return $this->masterUpdate($request, $latePolicy, ['name', 'code', 'grace_minutes', 'max_late_minutes', 'description', 'is_active']);
    }

    public function updateOvertimePolicy(Request $request, OvertimePolicy $overtimePolicy): JsonResponse
    {
        return $this->masterUpdate($request, $overtimePolicy, ['name', 'code', 'minimum_hours', 'multiplier', 'description', 'is_active']);
    }

    public function updateOnboardingChecklist(Request $request, OnboardingChecklist $onboardingChecklist): JsonResponse
    {
        return $this->masterUpdate($request, $onboardingChecklist, ['name', 'code', 'description', 'is_active']);
    }

    protected function masterDelete(Model $record): JsonResponse
    {
        $record->delete();

        return response()->json(['success' => true, 'message' => 'Master record deleted successfully.']);
    }

    public function deleteLeavePolicy(LeavePolicy $leavePolicy): JsonResponse
    {
        return $this->masterDelete($leavePolicy);
    }

    public function deleteAttendancePolicy(AttendancePolicy $attendancePolicy): JsonResponse
    {
        return $this->masterDelete($attendancePolicy);
    }

    public function deleteWorkSchedule(WorkSchedule $workSchedule): JsonResponse
    {
        return $this->masterDelete($workSchedule);
    }

    public function deleteShift(Shift $shift): JsonResponse
    {
        return $this->masterDelete($shift);
    }

    public function deleteWeeklyOff(WeeklyOff $weeklyOff): JsonResponse
    {
        return $this->masterDelete($weeklyOff);
    }

    public function deleteLatePolicy(LatePolicy $latePolicy): JsonResponse
    {
        return $this->masterDelete($latePolicy);
    }

    public function deleteOvertimePolicy(OvertimePolicy $overtimePolicy): JsonResponse
    {
        return $this->masterDelete($overtimePolicy);
    }

    public function deleteOnboardingChecklist(OnboardingChecklist $onboardingChecklist): JsonResponse
    {
        return $this->masterDelete($onboardingChecklist);
    }


    public function stepTwoMasters(Request $request): JsonResponse
    {
        $departments = Department::query()
            ->where('status', 'Active')
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $designationsQuery = Designation::query()
            ->where('status', 'Active')
            ->orderBy('name');

        if ($request->filled('department_id')) {
            $designationsQuery->where('department_id', $request->integer('department_id'));
        }

        $designations = $designationsQuery->get(['id', 'department_id', 'name', 'code']);

        $branches = Branch::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $locationsQuery = Location::query()
            ->where('is_active', true)
            ->orderBy('name');

        if ($request->filled('branch_id')) {
            $locationsQuery->where('branch_id', $request->integer('branch_id'));
        }

        $locations = $locationsQuery->get(['id', 'branch_id', 'name', 'code']);

        $reportingManagersQuery = Employee::query()
            ->where('employment_status', 'Active')
            ->orderBy('first_name');

        if ($request->filled('department_id')) {
            $reportingManagersQuery->where('department_id', $request->integer('department_id'));
        }

        $reportingManagers = $reportingManagersQuery
            ->get(['id', 'employee_code', 'first_name', 'last_name', 'department_id', 'designation_id'])
            ->map(function ($employee) {
                return [
                    'id' => $employee->id,
                    'employee_code' => $employee->employee_code,
                    'name' => trim($employee->first_name . ' ' . $employee->last_name),
                    'department_id' => $employee->department_id,
                    'designation_id' => $employee->designation_id,
                ];
            })
            ->values();

        $shifts = Shift::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'start_time', 'end_time', 'working_hours']);

        $workSchedules = WorkSchedule::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'start_time', 'end_time', 'working_hours']);

        return response()->json([
            'success' => true,
            'data' => [
                'departments' => $departments,
                'designations' => $designations,
                'branches' => $branches,
                'locations' => $locations,
                'reporting_managers' => $reportingManagers,
                'shifts' => $shifts,
                'work_schedules' => $workSchedules,
            ],
        ]);
    }
}
