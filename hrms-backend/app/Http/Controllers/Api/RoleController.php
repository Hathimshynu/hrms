<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        $query = Role::withCount('permissions')->with('permissions');

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $roles = $query->orderBy('id')->paginate(min((int) $request->get('per_page', 20), 100));

        return response()->json(['success' => true, 'data' => $roles]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles,name'],
        ]);

        $role = Role::create(['name' => $validated['name']]);

        return response()->json([
            'success' => true,
            'message' => 'Role created successfully.',
            'data' => $role,
        ], 201);
    }

    public function show(Role $role)
    {
        return response()->json([
            'success' => true,
            'data' => $role->load('permissions')->loadCount('permissions'),
        ]);
    }

    public function update(Request $request, Role $role)
    {
        if (! $this->canManageRole($request, $role)) {
            return $this->forbidden();
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('roles', 'name')->ignore($role->id)],
        ]);

        $role->update(['name' => $validated['name']]);

        return response()->json([
            'success' => true,
            'message' => 'Role updated successfully.',
            'data' => $role->fresh()->load('permissions')->loadCount('permissions'),
        ]);
    }

    public function destroy(Request $request, Role $role)
    {
        if (! $this->canManageRole($request, $role)) {
            return $this->forbidden();
        }

        if ($role->users()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Role cannot be deleted because users are assigned to this role.',
                'errors' => ['role' => ['Remove the role from assigned users before deleting it.']],
            ], 422);
        }

        DB::transaction(function () use ($role) {
            DB::table('role_has_permissions')->where('role_id', $role->id)->delete();
            $role->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Role deleted successfully.',
        ]);
    }

    public function permissions(Role $role)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'role' => [
                    'id' => $role->id,
                    'name' => $role->name,
                ],
                'permissions' => $role->permissions()->orderBy('permissions.id')->get(),
            ],
        ]);
    }

    public function syncPermissions(Request $request, Role $role)
    {
        $validated = $request->validate([
            'permission_ids' => ['required', 'array'],
            'permission_ids.*' => ['integer', 'distinct', 'exists:permissions,id'],
        ]);

        if (! $this->canManageRole($request, $role)) {
            return $this->forbidden();
        }

        $currentIds = $role->permissions()->pluck('permissions.id')->all();
        $addedIds = array_diff($validated['permission_ids'], $currentIds);

        if ($this->grantsBeyondActor($request, $addedIds)) {
            return $this->forbidden('You cannot grant permissions that you do not hold yourself.');
        }

        $role->permissions()->sync($validated['permission_ids']);

        return response()->json([
            'success' => true,
            'message' => 'Role permissions updated successfully.',
            'data' => [
                'role' => [
                    'id' => $role->id,
                    'name' => $role->name,
                ],
                'permissions' => $role->permissions()->orderBy('module')->orderBy('id')->get(),
            ],
        ]);
    }

    public function attachPermission(Request $request, Role $role, Permission $permission)
    {
        if (! $this->canManageRole($request, $role)) {
            return $this->forbidden();
        }

        if ($this->grantsBeyondActor($request, [$permission->id])) {
            return $this->forbidden('You cannot grant permissions that you do not hold yourself.');
        }

        if ($role->permissions()->where('permissions.id', $permission->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Permission is already assigned to this role.',
            ], 422);
        }

        $role->permissions()->attach($permission->id);

        return response()->json([
            'success' => true,
            'message' => 'Permission assigned successfully.',
            'data' => [
                'role_id' => $role->id,
                'permission_id' => $permission->id,
            ],
        ]);
    }

    public function detachPermission(Request $request, Role $role, Permission $permission)
    {
        if (! $this->canManageRole($request, $role)) {
            return $this->forbidden();
        }

        $deleted = $role->permissions()->detach($permission->id);

        if ($deleted === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Permission is not assigned to this role.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Permission removed successfully.',
        ]);
    }

    /** Only a Super Admin may change or delete the Super Admin role. */
    private function canManageRole(Request $request, Role $role): bool
    {
        return $role->name !== 'Super Admin' || $request->user('api')->hasRole('Super Admin');
    }

    /**
     * True when any of the given permission ids is one the acting user does not
     * hold (Super Admin holds all, so is never restricted).
     *
     * @param  array<int, int>  $permissionIds
     */
    private function grantsBeyondActor(Request $request, array $permissionIds): bool
    {
        $actor = $request->user('api');

        if ($permissionIds === [] || $actor->hasRole('Super Admin')) {
            return false;
        }

        $ownIds = $actor->role?->permissions()->pluck('permissions.id')->all() ?? [];

        return array_diff($permissionIds, $ownIds) !== [];
    }

    private function forbidden(string $message = 'You are not allowed to manage this role.')
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 403);
    }
}
