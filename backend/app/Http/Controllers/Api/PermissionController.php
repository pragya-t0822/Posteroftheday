<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    public function index()
    {
        return response()->json(Permission::orderBy('module')->get());
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
}
