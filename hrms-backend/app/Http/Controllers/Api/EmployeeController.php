<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employee\StoreEmployeeRequest;
use App\Http\Requests\Employee\UpdateEmployeeRequest;
use App\Mail\EmployeeAccountCredentials;
use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use App\Services\EmployeeCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class EmployeeController extends Controller
{
    public function __construct(
        protected EmployeeCodeService $codeService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Employee::query()
            ->with([
                'department:id,name,code',
                'designation:id,name,code',
                'branch:id,name,code',
                'location:id,name,code',
                'user:id,role_id,username,email,access_level,is_active',
            ]);

        if ($request->filled('search')) {
            $search = trim($request->string('search')->toString());

            $query->where(function ($q) use ($search) {
                $q->where('employee_code', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"])
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->integer('department_id'));
        }

        if ($request->filled('designation_id')) {
            $query->where('designation_id', $request->integer('designation_id'));
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->integer('branch_id'));
        }

        if ($request->filled('location_id')) {
            $query->where('location_id', $request->integer('location_id'));
        }

        if ($request->filled('reporting_manager_id')) {
            $query->where('reporting_manager_id', $request->integer('reporting_manager_id'));
        }

        if ($request->filled('employment_type')) {
            $query->where('employment_type', $request->string('employment_type')->toString());
        }

        if ($request->filled('work_mode')) {
            $query->where('work_mode', $request->string('work_mode')->toString());
        }

        if ($request->filled('status')) {
            $query->where('employment_status', $request->string('status')->toString());
        }

        if ($request->filled('lifecycle')) {
            $query->where('lifecycle', $request->string('lifecycle')->toString());
        }

        if ($request->filled('role_id')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('role_id', $request->integer('role_id'));
            });
        }

        if ($request->filled('access_level')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('access_level', $request->string('access_level')->toString());
            });
        }

        $allowedSorts = [
            'first_name',
            'last_name',
            'employee_code',
            'joining_date',
            'employment_status',
            'lifecycle',
            'created_at',
        ];

        $sortBy = $request->string('sort_by', 'created_at')->toString();
        $sortDirection = strtolower($request->string('sort_direction', 'desc')->toString());

        if (!in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'created_at';
        }

        if (!in_array($sortDirection, ['asc', 'desc'], true)) {
            $sortDirection = 'desc';
        }

        $perPage = $request->integer('limit', 20);
        $perPage = min(max($perPage, 1), 100);

        $employees = $query
            ->orderBy($sortBy, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        $employees->getCollection()->transform(function (Employee $employee) {
            return [
                'id' => $employee->id,
                'employee_code' => $employee->employee_code,
                'name' => trim($employee->first_name . ' ' . $employee->last_name),
                'first_name' => $employee->first_name,
                'last_name' => $employee->last_name,
                'email' => $employee->email,
                'phone' => $employee->phone,
                'job_title' => $employee->designation?->name,
                'department' => $employee->department ? [
                    'id' => $employee->department->id,
                    'name' => $employee->department->name,
                    'code' => $employee->department->code,
                ] : null,
                'designation' => $employee->designation ? [
                    'id' => $employee->designation->id,
                    'name' => $employee->designation->name,
                    'code' => $employee->designation->code,
                ] : null,
                'branch' => $employee->branch ? [
                    'id' => $employee->branch->id,
                    'name' => $employee->branch->name,
                    'code' => $employee->branch->code,
                ] : null,
                'location' => $employee->location ? [
                    'id' => $employee->location->id,
                    'name' => $employee->location->name,
                    'code' => $employee->location->code,
                ] : null,
                'salary' => $employee->salary,
                'joining_date' => $employee->joining_date?->format('Y-m-d'),
                'employment_type' => $employee->employment_type,
                'work_mode' => $employee->work_mode,
                'lifecycle' => $employee->lifecycle,
                'status' => $employee->employment_status,
                'profile_photo' => $employee->profile_photo,
                'account' => $employee->user ? [
                    'user_id' => $employee->user->id,
                    'username' => $employee->user->username,
                    'email' => $employee->user->email,
                    'role_id' => $employee->user->role_id,
                    'access_level' => $employee->user->access_level,
                    'is_active' => $employee->user->is_active,
                ] : null,
                'actions' => [
                    'view' => "/admin/employees/{$employee->id}",
                    'edit' => "/admin/employees/{$employee->id}/edit",
                ],
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Employees retrieved successfully.',
            'data' => $employees,
        ]);
    }

    public function store(StoreEmployeeRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $temporaryPassword = 'Aa9!' . Str::random(8);
        $employeeCode = $this->codeService->generate();

        $employee = DB::transaction(function () use ($validated, $temporaryPassword, $employeeCode) {
            $role = Role::find($validated['role_id'] ?? null)
                ?? Role::where('name', 'Employee')->firstOrFail();

            $user = User::create([
                'name' => trim($validated['first_name'] . ' ' . $validated['last_name']),
                'email' => strtolower($validated['email']),
                'password' => Hash::make($temporaryPassword),
                'role_id' => $role->id,
                'must_change_password' => true,
            ]);

            $validated['user_id'] = $user->id;
            $validated['employee_code'] = $employeeCode;

            return Employee::create($validated);
        });

        Mail::to($employee->email)->send(new EmployeeAccountCredentials(
            $employee->first_name . ' ' . $employee->last_name,
            $employee->email,
            $temporaryPassword,
        ));

        return response()->json([
            'success' => true,
            'message' => 'Employee created successfully. Login credentials were sent to the company email.',
            'data' => $employee->load(['department', 'designation', 'user']),
        ], Response::HTTP_CREATED);
    }

    public function show(Employee $employee): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $employee->load(['department', 'designation', 'user.role']),
        ]);
    }

    public function update(UpdateEmployeeRequest $request, Employee $employee): JsonResponse
    {
        $employee->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Employee updated successfully.',
            'data' => $employee->fresh()->load(['department', 'designation', 'user']),
        ]);
    }

    public function destroy(Employee $employee): JsonResponse
    {
        $employee->delete();

        return response()->json([
            'success' => true,
            'message' => 'Employee deleted successfully.',
        ]);
    }
}
