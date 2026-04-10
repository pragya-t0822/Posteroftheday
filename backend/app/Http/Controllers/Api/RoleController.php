<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Traits\HasAdvancedFiltering;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    use HasAdvancedFiltering;

    public function index(Request $request)
    {
        $query = Role::with('permissions')->where('is_active', true);

        $this->applySearch($query, $request, ['name']);
        $this->applyDateRange($query, $request);

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:roles',
            'description' => 'nullable|string',
        ]);

        $role = Role::create($request->only('name', 'slug', 'description'));

        return response()->json($role->load('permissions'), 201);
    }

    public function show(Role $role)
    {
        return response()->json($role->load('permissions'));
    }

    public function update(Request $request, Role $role)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255|unique:roles,slug,' . $role->id,
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);

        $role->update($request->only('name', 'slug', 'description', 'is_active'));

        return response()->json($role->load('permissions'));
    }

    public function destroy(Role $role)
    {
        if (in_array($role->slug, ['super_admin'])) {
            return response()->json(['message' => 'Cannot delete the Super Admin role'], 403);
        }

        $role->delete();

        return response()->json(['message' => 'Role deleted']);
    }

    public function assignPermissions(Request $request, Role $role)
    {
        $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $role->permissions()->sync($request->permissions);

        return response()->json($role->load('permissions'));
    }

    public function bulkDelete(Request $request)
    {
        return $this->bulkDestroy(Role::class, $request);
    }

    public function export(Request $request)
    {
        return $this->exportCsv(Role::class, $request,
            ['id', 'name', 'slug', 'created_at'],
            ['ID', 'Name', 'Slug', 'Created At'],
            'roles.csv'
        );
    }
}
