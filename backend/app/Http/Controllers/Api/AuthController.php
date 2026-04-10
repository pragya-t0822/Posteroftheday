<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => $request->password,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;
        $user->load('role.permissions');

        return response()->json([
            'user'        => $user,
            'token'       => $token,
            'permissions' => $user->role ? $user->role->permissions->pluck('slug') : [],
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::with('role')->where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->role && $user->role->slug === 'customer') {
            throw ValidationException::withMessages([
                'email' => ['Admin access only. Customers cannot log in here.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        $user->load('role.permissions');

        return response()->json([
            'user'        => $user,
            'token'       => $token,
            'permissions' => $user->role ? $user->role->permissions->pluck('slug') : [],
        ]);
    }

    public function customerLogin(Request $request)
    {
        $request->validate([
            'login'    => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::with('role')->where(function ($q) use ($request) {
            $q->where('email', $request->login)
              ->orWhere('phone', $request->login);
        })->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (! $user->role || $user->role->slug !== 'customer') {
            throw ValidationException::withMessages([
                'login' => ['This login is for customers only.'],
            ]);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'login' => ['Your account is inactive. Please contact support.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        $user->load('role.permissions');

        return response()->json([
            'user'        => $user,
            'token'       => $token,
            'permissions' => $user->role ? $user->role->permissions->pluck('slug') : [],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request)
    {
        $user = $request->user()->load('role.permissions');

        return response()->json([
            'user' => $user,
            'permissions' => $user->role ? $user->role->permissions->pluck('slug') : [],
        ]);
    }
}
