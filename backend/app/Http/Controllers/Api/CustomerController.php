<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = User::whereHas('role', fn($q) => $q->where('slug', 'customer'));

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $customers = $query->with('role')
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 10));

        return response()->json($customers);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'status' => 'nullable|in:active,inactive',
            'password' => 'required|string|min:8',
        ]);

        $customerRole = Role::where('slug', 'customer')->first();

        $customer = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'status' => $request->status ?? 'active',
            'password' => Hash::make($request->password),
            'role_id' => $customerRole?->id,
        ]);

        return response()->json($customer->load('role'), 201);
    }

    public function show(string $id)
    {
        $customer = User::findOrFail($id);
        $customer->load([
            'role',
            'subscriptions' => fn($q) => $q->orderByDesc('created_at'),
            'subscriptions.package',
            'subscriptions.payments',
        ]);

        return response()->json($customer);
    }

    public function update(Request $request, string $id)
    {
        $customer = User::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $customer->id,
            'phone' => 'nullable|string|max:20',
            'status' => 'nullable|in:active,inactive',
            'password' => 'sometimes|string|min:8',
        ]);

        $data = $request->only('name', 'email', 'phone', 'status');
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $customer->update($data);

        return response()->json($customer->load('role'));
    }

    public function destroy(string $id)
    {
        $customer = User::findOrFail($id);
        $customer->tokens()->delete();
        $customer->delete();

        return response()->json(['message' => 'Customer deleted']);
    }
}
