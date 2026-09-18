<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'view dashboard',
            'view employees',
            'create employees',
            'edit employees',
            'delete employees',
            'view employee details',
            'view departments',
            'create departments',
            'edit departments',
            'delete departments',
            'view designations',
            'create designations',
            'edit designations',
            'delete designations',
            'view attendance',
            'create attendance',
            'edit attendance',
            'delete attendance',
            'view leaves',
            'create leaves',
            'edit leaves',
            'delete leaves',
            'approve leaves',
            'reject leaves',
            'view payroll',
            'create payroll',
            'edit payroll',
            'delete payroll',
            'process payroll',
            'view reports',
            'export reports',
            'view users',
            'create users',
            'edit users',
            'delete users',
            'manage roles',
            'manage permissions',
            'assign roles',
            'assign permissions',
            'view employee drafts',
            'create employee drafts',
            'edit employee drafts',
            'delete employee drafts',
            'complete employee onboarding',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $roles = [
            'Super Admin' => Permission::all()->pluck('name')->all(),
            'Admin' => [
                'view dashboard',
                'view employees',
                'create employees',
                'edit employees',
                'delete employees',
                'view employee details',
                'view departments',
                'create departments',
                'edit departments',
                'delete departments',
                'view designations',
                'create designations',
                'edit designations',
                'delete designations',
                'view attendance',
                'create attendance',
                'edit attendance',
                'view leaves',
                'create leaves',
                'edit leaves',
                'approve leaves',
                'view payroll',
                'create payroll',
                'edit payroll',
                'view reports',
                'export reports',
                'view users',
                'create users',
                'edit users',
                'manage roles',
                'manage permissions',
                'assign roles',
                'assign permissions',
                'view employee drafts',
                'create employee drafts',
                'edit employee drafts',
                'delete employee drafts',
                'complete employee onboarding',
            ],
            'HR' => [
                'view dashboard',
                'view employees',
                'create employees',
                'edit employees',
                'view employee details',
                'view departments',
                'view designations',
                'view attendance',
                'create attendance',
                'edit attendance',
                'view leaves',
                'approve leaves',
                'reject leaves',
                'view reports',
                'export reports',
                'view employee drafts',
                'create employee drafts',
                'edit employee drafts',
                'delete employee drafts',
                'complete employee onboarding',
            ],
            'Manager' => [
                'view dashboard',
                'view employees',
                'view employee details',
                'view attendance',
                'create attendance',
                'view leaves',
                'approve leaves',
                'reject leaves',
                'view reports',
            ],
            'Team Leader' => [
                'view dashboard',
                'view employees',
                'view employee details',
                'view attendance',
                'create attendance',
                'edit attendance',
                'view leaves',
                'approve leaves',
                'reject leaves',
                'view reports',
            ],
            'Employee' => [
                'view dashboard',
                'view employee details',
                'view attendance',
                'create attendance',
                'view leaves',
                'create leaves',
                'edit leaves',
            ],
        ];

        foreach ($roles as $roleName => $allowedPermissions) {
            $role = Role::firstOrCreate(['name' => $roleName]);
            $role->syncPermissions($allowedPermissions);
        }

        $superAdmin = User::firstOrCreate([
            'email' => env('ADMIN_EMAIL'),
        ], [
            'name' => 'Super Admin',
            'password' => Hash::make(env('ADMIN_PASSWORD')),
        ]);

        $superAdmin->assignRole('Super Admin');
    }
}
