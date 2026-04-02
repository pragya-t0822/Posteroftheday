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
                'title' => 'Customers',
                'icon' => 'UserGroup',
                'route' => '/customers',
                'permission_slug' => 'customers.view',
                'sort_order' => 2,
            ],
            [
                'title' => 'Categories',
                'icon' => 'Folder',
                'route' => '/categories',
                'permission_slug' => 'categories.view',
                'sort_order' => 3,
            ],
            [
                'title' => 'Upload Frames',
                'icon' => 'Upload',
                'route' => '/frames',
                'permission_slug' => 'frames.view',
                'sort_order' => 4,
            ],
            [
                'title' => 'Frame Layers',
                'icon' => 'Layers',
                'route' => '/frame-layers',
                'permission_slug' => 'frame-layers.view',
                'sort_order' => 5,
            ],
            [
                'title' => 'Frame Layer Requests',
                'icon' => 'Inbox',
                'route' => '/frame-requests',
                'permission_slug' => 'frame-requests.view',
                'sort_order' => 6,
            ],
            [
                'title' => 'Reminders',
                'icon' => 'Bell',
                'route' => '/reminders',
                'permission_slug' => 'reminders.view',
                'sort_order' => 7,
            ],
            [
                'title' => 'User Management',
                'icon' => 'Users',
                'route' => '/users',
                'permission_slug' => 'users.view',
                'sort_order' => 8,
            ],
            [
                'title' => 'Roles & Access',
                'icon' => 'Shield',
                'route' => null,
                'permission_slug' => 'roles.view',
                'sort_order' => 9,
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
                'title' => 'Packages',
                'icon' => 'CreditCard',
                'route' => '/packages',
                'permission_slug' => 'subscriptions.view',
                'sort_order' => 10,
            ],
            [
                'title' => 'Settings',
                'icon' => 'Settings',
                'route' => '/settings',
                'permission_slug' => 'settings.view',
                'sort_order' => 11,
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
