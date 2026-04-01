<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NavigationItem;
use Illuminate\Http\Request;

class NavigationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $userPermissions = [];

        if ($user && $user->role) {
            if ($user->role->slug === 'super_admin') {
                return response()->json(
                    NavigationItem::whereNull('parent_id')
                        ->where('is_active', true)
                        ->with(['children' => fn($q) => $q->where('is_active', true)->orderBy('sort_order')])
                        ->orderBy('sort_order')
                        ->get()
                );
            }

            $userPermissions = $user->role->permissions()->pluck('slug')->toArray();
        }

        $items = NavigationItem::whereNull('parent_id')
            ->where('is_active', true)
            ->where(function ($query) use ($userPermissions) {
                $query->whereNull('permission_slug')
                      ->orWhereIn('permission_slug', $userPermissions);
            })
            ->with(['children' => function ($query) use ($userPermissions) {
                $query->where('is_active', true)
                      ->where(function ($q) use ($userPermissions) {
                          $q->whereNull('permission_slug')
                            ->orWhereIn('permission_slug', $userPermissions);
                      })
                      ->orderBy('sort_order');
            }])
            ->orderBy('sort_order')
            ->get();

        return response()->json($items);
    }
}
