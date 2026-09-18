<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class PermissionController extends Controller
{
    public function index(Request $request)
    {
        $query = Permission::query();

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('module')) {
            $query->where('module', $request->module);
        }

        $permissions = $query->orderBy('module')->orderBy('id')->paginate(min((int) $request->get('per_page', 100), 100));

        return response()->json([
            'success' => true,
            'data' => $permissions,
        ]);
    }

    public function grouped()
    {
        $permissions = Permission::orderBy('module')->orderBy('id')->get();

        $grouped = $permissions->groupBy('module')->map(function ($permissions, $module) {
            return [
                'module' => $module,
                'permissions' => $permissions->values(),
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $grouped,
        ]);
    }

    public function modules()
    {
        $modules = Permission::query()
            ->select('module')
            ->whereNotNull('module')
            ->distinct()
            ->orderBy('module')
            ->pluck('module');

        return response()->json([
            'success' => true,
            'data' => $modules,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:permissions,name'],
            'module' => ['required', 'string', 'max:100'],
            'action' => ['required', 'string', 'max:100'],
        ]);

        $exists = Permission::where('module', $validated['module'])
            ->where('action', $validated['action'])
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'A permission with this module and action already exists.',
            ], 422);
        }

        $permission = Permission::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Permission created successfully.',
            'data' => $permission,
        ], 201);
    }

    public function show(Permission $permission)
    {
        return response()->json([
            'success' => true,
            'data' => $permission->load('roles'),
        ]);
    }

    public function update(Request $request, Permission $permission)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('permissions', 'name')->ignore($permission->id)],
            'module' => ['required', 'string', 'max:100'],
            'action' => ['required', 'string', 'max:100'],
        ]);

        $exists = Permission::where('module', $validated['module'])
            ->where('action', $validated['action'])
            ->where('id', '!=', $permission->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'A permission with this module and action already exists.',
            ], 422);
        }

        $permission->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Permission updated successfully.',
            'data' => $permission->fresh(),
        ]);
    }

    public function destroy(Permission $permission)
    {
        $assignedRoles = DB::table('role_has_permissions')
            ->where('permission_id', $permission->id)
            ->count();

        if ($assignedRoles > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Permission cannot be deleted because it is assigned to one or more roles.',
                'errors' => [
                    'permission' => ['Remove this permission from all roles before deleting it.'],
                ],
            ], 422);
        }

        $permission->delete();

        return response()->json([
            'success' => true,
            'message' => 'Permission deleted successfully.',
        ]);
    }
}