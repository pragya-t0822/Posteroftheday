<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\HasAdvancedFiltering;
use Illuminate\Http\Request;

class UserController extends Controller
{
    use HasAdvancedFiltering;

    public function index(Request $request)
    {
        $query = User::with('role')
            ->whereDoesntHave('role', fn($q) => $q->where('slug', 'customer'));

        $this->applySearch($query, $request, ['name', 'email']);
        $this->applyFilters($query, $request, ['status' => 'status']);
        $this->applyDateRange($query, $request);

        return response()->json($query->get());
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
            'password' => $request->password,
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
            $data['password'] = $request->password;
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

    public function bulkActivate(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'integer']);
        $count = User::whereIn('id', $request->input('ids'))
            ->whereDoesntHave('role', fn($q) => $q->where('slug', 'customer'))
            ->update(['status' => 'active']);
        return response()->json(['message' => "{$count} user(s) activated", 'count' => $count]);
    }

    public function bulkDeactivate(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'integer']);
        $count = User::whereIn('id', $request->input('ids'))
            ->whereDoesntHave('role', fn($q) => $q->where('slug', 'customer'))
            ->update(['status' => 'inactive']);
        return response()->json(['message' => "{$count} user(s) deactivated", 'count' => $count]);
    }

    public function bulkDelete(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'integer']);
        $count = User::whereIn('id', $request->input('ids'))
            ->whereDoesntHave('role', fn($q) => $q->where('slug', 'customer'))
            ->delete();
        return response()->json(['message' => "{$count} user(s) deleted", 'count' => $count]);
    }

    public function export(Request $request)
    {
        return $this->exportCsv(User::class, $request,
            ['id', 'name', 'email', 'phone', 'status', 'created_at'],
            ['ID', 'Name', 'Email', 'Phone', 'Status', 'Created At'],
            'users.csv'
        );
    }
}
