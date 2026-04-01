<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(
            User::with('role')
                ->whereDoesntHave('role', fn($q) => $q->where('slug', 'customer'))
                ->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role_id' => 'required|exists:roles,id',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $request->role_id,
        ]);

        return response()->json($user->load('role'), 201);
    }

    public function show(User $user)
    {
        return response()->json($user->load('role'));
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'sometimes|string|min:8',
            'role_id' => 'sometimes|exists:roles,id',
        ]);

        $data = $request->only('name', 'email', 'role_id');
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return response()->json($user->load('role'));
    }

    public function destroy(User $user)
    {
        if ($user->role && $user->role->slug === 'super_admin') {
            $superAdminCount = User::whereHas('role', fn($q) => $q->where('slug', 'super_admin'))->count();
            if ($superAdminCount <= 1) {
                return response()->json(['message' => 'Cannot delete the last Super Admin'], 403);
            }
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'User deleted']);
    }
}
