<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /**
     * Display a listing of roles with their permissions.
     */
    public function index(): JsonResponse
    {
        $roles = Role::with('permissions')->get()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
            ];
        });

        $permissions = Permission::all()->map(function ($perm) {
            return [
                'id' => $perm->id,
                'name' => $perm->name,
            ];
        });

        return $this->successResponse([
            'roles' => $roles,
            'permissions' => $permissions,
        ], 'Roles and permissions retrieved successfully');
    }

    /**
     * Store a newly created role.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role = Role::create([
            'name' => strtolower($validated['name']),
            'guard_name' => 'web',
        ]);

        if (!empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return $this->successResponse($role->load('permissions'), 'Role created successfully', 201);
    }

    /**
     * Update the specified role.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        // Protect system roles from name changes
        $isSystemRole = in_array($role->name, ['admin', 'manager', 'staff']);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        if (!$isSystemRole) {
            $role->name = strtolower($validated['name']);
            $role->save();
        }

        $role->syncPermissions($validated['permissions'] ?? []);

        return $this->successResponse($role->load('permissions'), 'Role updated successfully');
    }

    /**
     * Remove the specified role.
     */
    public function destroy(string $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        // Protect system roles
        if (in_array($role->name, ['admin', 'manager', 'staff'])) {
            return $this->errorResponse('Tidak dapat menghapus Role bawaan sistem (admin, manager, staff).', 400);
        }

        $role->delete();

        return $this->successResponse(null, 'Role deleted successfully');
    }
}
