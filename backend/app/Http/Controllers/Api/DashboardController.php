<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        return response()->json([
            'total_users'        => User::whereHas('role', fn($q) => $q->where('slug', 'customer'))->count(),
            'active_memberships' => Subscription::where('status', 'active')->where('ends_at', '>', now())->count(),
            'total_roles'        => Role::where('is_active', true)->count(),
            'total_permissions'  => Permission::count(),
        ]);
    }
}
