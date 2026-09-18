<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            $table->string('module', 100)->nullable()->after('name');
            $table->string('action', 100)->nullable()->after('module');
            $table->index('module');
            $table->index(['module', 'action']);
        });

        $permissions = DB::table('permissions')->get();

        foreach ($permissions as $permission) {
            $name = strtolower(trim($permission->name));
            $module = 'other';
            $action = 'manage';

            $map = [
                'view dashboard' => ['dashboard', 'view'],

                'view employees' => ['employees', 'view'],
                'create employees' => ['employees', 'create'],
                'edit employees' => ['employees', 'edit'],
                'delete employees' => ['employees', 'delete'],
                'view employee details' => ['employees', 'view_details'],

                'view departments' => ['departments', 'view'],
                'create departments' => ['departments', 'create'],
                'edit departments' => ['departments', 'edit'],
                'delete departments' => ['departments', 'delete'],

                'view designations' => ['designations', 'view'],
                'create designations' => ['designations', 'create'],
                'edit designations' => ['designations', 'edit'],
                'delete designations' => ['designations', 'delete'],

                'view attendance' => ['attendance', 'view'],
                'create attendance' => ['attendance', 'create'],
                'edit attendance' => ['attendance', 'edit'],
                'delete attendance' => ['attendance', 'delete'],
                'check in attendance' => ['attendance', 'check_in'],
                'check out attendance' => ['attendance', 'check_out'],

                'view users' => ['users', 'view'],
                'create users' => ['users', 'create'],
                'edit users' => ['users', 'edit'],
                'delete users' => ['users', 'delete'],

                'view employee drafts' => ['employee_drafts', 'view'],
                'create employee drafts' => ['employee_drafts', 'create'],
                'edit employee drafts' => ['employee_drafts', 'edit'],
                'delete employee drafts' => ['employee_drafts', 'delete'],
                'complete employee onboarding' => ['employee_onboarding', 'complete'],

                'manage roles' => ['roles', 'manage'],
                'manage permissions' => ['permissions', 'manage'],
            ];

            if (isset($map[$name])) {
                [$module, $action] = $map[$name];
            }

            DB::table('permissions')
                ->where('id', $permission->id)
                ->update([
                    'module' => $module,
                    'action' => $action,
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            $table->dropIndex(['module']);
            $table->dropIndex(['module', 'action']);
            $table->dropColumn(['module', 'action']);
        });
    }
};