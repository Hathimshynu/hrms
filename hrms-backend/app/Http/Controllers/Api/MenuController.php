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
            ['id' => 'departments', 'module' => 'departments', 'label' => 'Departments', 'routePath' => '/admin/departments', 'view' => 'view departments', 'edit' => 'edit departments', 'delete' => 'delete departments'],
            ['id' => 'designations', 'module' => 'designations', 'label' => 'Designations', 'routePath' => '/admin/designations', 'view' => 'view designations', 'edit' => 'edit designations', 'delete' => 'delete designations'],
            ['id' => 'attendance', 'module' => 'attendance', 'label' => 'Attendance', 'routePath' => '/admin/attendance', 'view' => 'view attendance', 'edit' => 'edit attendance', 'delete' => 'delete attendance'],
            ['id' => 'leaves', 'module' => 'leaves', 'label' => 'Leaves', 'routePath' => '/admin/leaves', 'view' => 'view leaves', 'edit' => 'edit leaves', 'delete' => 'delete leaves'],
            ['id' => 'payroll', 'module' => 'payroll', 'label' => 'Payroll', 'routePath' => '/admin/payroll', 'view' => 'view payroll', 'edit' => 'edit payroll', 'delete' => 'delete payroll'],
            ['id' => 'reports', 'module' => 'reports', 'label' => 'Reports', 'routePath' => '/admin/reports', 'view' => 'view reports', 'edit' => null, 'delete' => null],
            ['id' => 'users', 'module' => 'users', 'label' => 'Users', 'routePath' => '/admin/users', 'view' => 'view users', 'edit' => 'edit users', 'delete' => 'delete users'],
            ['id' => 'roles', 'module' => 'roles', 'label' => 'Roles & Permissions', 'routePath' => '/admin/roles', 'view' => 'manage roles', 'edit' => 'manage roles', 'delete' => null],
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