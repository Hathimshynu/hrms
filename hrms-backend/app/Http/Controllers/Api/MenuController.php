<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user('api');

        $menus = [
            ['id' => 'dashboard', 'module' => 'dashboard', 'label' => 'Dashboard', 'routePath' => '/admin/dashboard', 'view' => 'view dashboard', 'edit' => null, 'delete' => null],
            ['id' => 'employees', 'module' => 'employees', 'label' => 'Employees', 'routePath' => '/admin/employees', 'view' => 'view employees', 'edit' => 'edit employees', 'delete' => 'delete employees'],
            ['id' => 'employee-drafts', 'module' => 'employeeDrafts', 'label' => 'Employee Drafts', 'routePath' => '/people/drafts', 'view' => 'view employee drafts', 'edit' => 'edit employee drafts', 'delete' => 'delete employee drafts'],
            ['id' => 'departments', 'module' => 'departments', 'label' => 'Departments', 'routePath' => '/admin/departments', 'view' => 'view departments', 'edit' => 'edit departments', 'delete' => 'delete departments'],
            ['id' => 'designations', 'module' => 'designations', 'label' => 'Designations', 'routePath' => '/admin/designations', 'view' => 'view designations', 'edit' => 'edit designations', 'delete' => 'delete designations'],
            ['id' => 'attendance', 'module' => 'attendance', 'label' => 'Attendance', 'routePath' => '/admin/attendance', 'view' => 'view attendance', 'edit' => 'edit attendance', 'delete' => 'delete attendance'],
            ['id' => 'leaves', 'module' => 'leaves', 'label' => 'Leaves', 'routePath' => '/admin/leaves', 'view' => 'view leaves', 'edit' => 'edit leaves', 'delete' => 'delete leaves'],
            ['id' => 'payroll', 'module' => 'payroll', 'label' => 'Payroll', 'routePath' => '/admin/payroll', 'view' => 'view payroll', 'edit' => 'edit payroll', 'delete' => 'delete payroll'],
            ['id' => 'reports', 'module' => 'reports', 'label' => 'Reports', 'routePath' => '/admin/reports', 'view' => 'view reports', 'edit' => null, 'delete' => null],
            ['id' => 'users', 'module' => 'users', 'label' => 'Users', 'routePath' => '/admin/users', 'view' => 'view users', 'edit' => 'edit users', 'delete' => 'delete users'],
            ['id' => 'roles', 'module' => 'roles', 'label' => 'Roles', 'routePath' => '/admin/roles', 'view' => 'manage roles', 'edit' => 'manage roles', 'delete' => 'manage roles'],
            ['id' => 'permissions', 'module' => 'permissions', 'label' => 'Permissions', 'routePath' => '/admin/permissions', 'view' => 'manage permissions', 'edit' => 'manage permissions', 'delete' => 'manage permissions'],
            ['id' => 'branches', 'module' => 'branches', 'label' => 'Branches', 'routePath' => '/masters/branches', 'view' => 'create employee drafts', 'edit' => null, 'delete' => null],
            ['id' => 'locations', 'module' => 'locations', 'label' => 'Locations', 'routePath' => '/masters/locations', 'view' => 'create employee drafts', 'edit' => null, 'delete' => null],
            ['id' => 'leave-policies', 'module' => 'leavePolicies', 'label' => 'Leave Policies', 'routePath' => '/masters/leave-policies', 'view' => 'create employee drafts', 'edit' => 'edit leave policies', 'delete' => 'delete leave policies'],
            ['id' => 'attendance-policies', 'module' => 'attendancePolicies', 'label' => 'Attendance Policies', 'routePath' => '/masters/attendance-policies', 'view' => 'create employee drafts', 'edit' => 'edit attendance policies', 'delete' => 'delete attendance policies'],
            ['id' => 'work-schedules', 'module' => 'workSchedules', 'label' => 'Work Schedules', 'routePath' => '/masters/work-schedules', 'view' => 'create employee drafts', 'edit' => 'edit work schedules', 'delete' => 'delete work schedules'],
            ['id' => 'shifts', 'module' => 'shifts', 'label' => 'Shifts', 'routePath' => '/masters/shifts', 'view' => 'create employee drafts', 'edit' => 'edit shifts', 'delete' => 'delete shifts'],
            ['id' => 'weekly-offs', 'module' => 'weeklyOffs', 'label' => 'Weekly Offs', 'routePath' => '/masters/weekly-offs', 'view' => 'create employee drafts', 'edit' => 'edit weekly offs', 'delete' => 'delete weekly offs'],
            ['id' => 'late-policies', 'module' => 'latePolicies', 'label' => 'Late Policies', 'routePath' => '/masters/late-policies', 'view' => 'create employee drafts', 'edit' => 'edit late policies', 'delete' => 'delete late policies'],
            ['id' => 'overtime-policies', 'module' => 'overtimePolicies', 'label' => 'Overtime Policies', 'routePath' => '/masters/overtime-policies', 'view' => 'create employee drafts', 'edit' => 'edit overtime policies', 'delete' => 'delete overtime policies'],
            ['id' => 'onboarding-checklists', 'module' => 'onboardingChecklists', 'label' => 'Onboarding Checklists', 'routePath' => '/masters/onboarding-checklists', 'view' => 'create employee drafts', 'edit' => 'edit onboarding checklists', 'delete' => 'delete onboarding checklists'],
        ];

        $data = collect($menus)->filter(function (array $menu) use ($user) {
            return $user->can($menu['view']);
        })->map(function (array $menu) use ($user) {
            return [
                'id' => $menu['id'],
                'module' => $menu['module'],
                'label' => $menu['label'],
                'routePath' => $menu['routePath'],
                'access' => [
                    'view' => $user->can($menu['view']),
                    'edit' => $menu['edit'] ? $user->can($menu['edit']) : false,
                    'delete' => $menu['delete'] ? $user->can($menu['delete']) : false,
                ],
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}