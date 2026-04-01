<?php

namespace Database\Seeders;

use App\Models\NavigationItem;
use Illuminate\Database\Seeder;

class NavigationSeeder extends Seeder
{
    public function run(): void
    {
        NavigationItem::truncate();

        $items = [
            [
                'title' => 'Dashboard',
                'icon' => 'LayoutDashboard',
                'route' => '/dashboard',
                'permission_slug' => 'dashboard.view',
                'sort_order' => 1,
            ],
            [
                'title' => 'Posters',
                'icon' => 'Image',
                'route' => '/posters',
                'permission_slug' => 'posters.view',
                'sort_order' => 2,
            ],
            [
                'title' => 'Subscriptions',
                'icon' => 'CreditCard',
                'route' => '/subscriptions',
                'permission_slug' => 'subscriptions.view',
                'sort_order' => 3,
            ],
            [
                'title' => 'User Management',
                'icon' => 'Users',
                'route' => '/users',
                'permission_slug' => 'users.view',
                'sort_order' => 4,
            ],
            [
                'title' => 'Roles & Access',
                'icon' => 'Shield',
                'route' => null,
                'permission_slug' => 'roles.view',
                'sort_order' => 5,
                'children' => [
                    [
                        'title' => 'Roles',
                        'icon' => 'ShieldCheck',
                        'route' => '/roles',
                        'permission_slug' => 'roles.view',
                        'sort_order' => 1,
                    ],
                    [
                        'title' => 'Permissions',
                        'icon' => 'Key',
                        'route' => '/permissions',
                        'permission_slug' => 'permissions.view',
                        'sort_order' => 2,
                    ],
                ],
            ],
            [
                'title' => 'Settings',
                'icon' => 'Settings',
                'route' => '/settings',
                'permission_slug' => 'settings.view',
                'sort_order' => 6,
            ],
        ];

        foreach ($items as $item) {
            $children = $item['children'] ?? [];
            unset($item['children']);

            $parent = NavigationItem::create($item);

            foreach ($children as $child) {
                $child['parent_id'] = $parent->id;
                NavigationItem::create($child);
            }
        }
    }
}
