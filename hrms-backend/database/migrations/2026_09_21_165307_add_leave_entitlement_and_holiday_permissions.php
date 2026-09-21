<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Additive: only creates the permission rows. It deliberately does NOT
     * attach them to any role - an administrator grants them from the Roles
     * screen after reviewing who should manage entitlements and holidays.
     */
    private const PERMISSIONS = [
        'view leave entitlements' => ['leave entitlements', 'view'],
        'create leave entitlements' => ['leave entitlements', 'create'],
        'edit leave entitlements' => ['leave entitlements', 'edit'],
        'delete leave entitlements' => ['leave entitlements', 'delete'],
        'view holidays' => ['holidays', 'view'],
        'create holidays' => ['holidays', 'create'],
        'edit holidays' => ['holidays', 'edit'],
        'delete holidays' => ['holidays', 'delete'],
    ];

    public function up(): void
    {
        foreach (self::PERMISSIONS as $name => [$module, $action]) {
            if (! DB::table('permissions')->where('name', $name)->exists()) {
                DB::table('permissions')->insert([
                    'name' => $name,
                    'module' => $module,
                    'action' => $action,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        $ids = DB::table('permissions')->whereIn('name', array_keys(self::PERMISSIONS))->pluck('id');
        DB::table('role_has_permissions')->whereIn('permission_id', $ids)->delete();
        DB::table('permissions')->whereIn('id', $ids)->delete();
    }
};
