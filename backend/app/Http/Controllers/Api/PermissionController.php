<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Traits\HasAdvancedFiltering;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    use HasAdvancedFiltering;

    public function index(Request $request)
    {
        $query = Permission::orderBy('module');

        $this->applySearch($query, $request, ['name', 'slug']);
        $this->applyDateRange($query, $request);

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:permissions',
            'module' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $permission = Permission::create($request->only('name', 'slug', 'module', 'description'));

        return response()->json($permission, 201);
    }

    public function show(Permission $permission)
    {
        return response()->json($permission);
    }

    public function update(Request $request, Permission $permission)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255|unique:permissions,slug,' . $permission->id,
            'module' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
        ]);

        $permission->update($request->only('name', 'slug', 'module', 'description'));

        return response()->json($permission);
    }

    public function destroy(Permission $permission)
    {
        $permission->delete();

        return response()->json(['message' => 'Permission deleted']);
    }

    public function bulkDelete(Request $request)
    {
        return $this->bulkDestroy(Permission::class, $request);
    }

    public function export(Request $request)
    {
        return $this->exportCsv(Permission::class, $request,
            ['id', 'name', 'slug', 'module', 'created_at'],
            ['ID', 'Name', 'Slug', 'Module', 'Created At'],
            'permissions.csv'
        );
    }
}
