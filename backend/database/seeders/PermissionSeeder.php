<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // Dashboard
            ['name' => 'View Dashboard', 'slug' => 'dashboard.view', 'module' => 'Dashboard'],

            // Users
            ['name' => 'View Users', 'slug' => 'users.view', 'module' => 'Users'],
            ['name' => 'Create Users', 'slug' => 'users.create', 'module' => 'Users'],
            ['name' => 'Edit Users', 'slug' => 'users.edit', 'module' => 'Users'],
            ['name' => 'Delete Users', 'slug' => 'users.delete', 'module' => 'Users'],

            // Roles
            ['name' => 'View Roles', 'slug' => 'roles.view', 'module' => 'Roles'],
            ['name' => 'Create Roles', 'slug' => 'roles.create', 'module' => 'Roles'],
            ['name' => 'Edit Roles', 'slug' => 'roles.edit', 'module' => 'Roles'],
            ['name' => 'Delete Roles', 'slug' => 'roles.delete', 'module' => 'Roles'],
            ['name' => 'Assign Permissions', 'slug' => 'roles.assign_permissions', 'module' => 'Roles'],

            // Permissions
            ['name' => 'View Permissions', 'slug' => 'permissions.view', 'module' => 'Permissions'],
            ['name' => 'Create Permissions', 'slug' => 'permissions.create', 'module' => 'Permissions'],
            ['name' => 'Edit Permissions', 'slug' => 'permissions.edit', 'module' => 'Permissions'],
            ['name' => 'Delete Permissions', 'slug' => 'permissions.delete', 'module' => 'Permissions'],

            // Navigation
            ['name' => 'View Navigation', 'slug' => 'navigation.view', 'module' => 'Navigation'],

            // Posters
            ['name' => 'View Posters', 'slug' => 'posters.view', 'module' => 'Posters'],
            ['name' => 'Create Posters', 'slug' => 'posters.create', 'module' => 'Posters'],
            ['name' => 'Edit Posters', 'slug' => 'posters.edit', 'module' => 'Posters'],
            ['name' => 'Delete Posters', 'slug' => 'posters.delete', 'module' => 'Posters'],

            // Subscriptions
            ['name' => 'View Subscriptions', 'slug' => 'subscriptions.view', 'module' => 'Subscriptions'],
            ['name' => 'Create Subscriptions', 'slug' => 'subscriptions.create', 'module' => 'Subscriptions'],
            ['name' => 'Edit Subscriptions', 'slug' => 'subscriptions.edit', 'module' => 'Subscriptions'],
            ['name' => 'Delete Subscriptions', 'slug' => 'subscriptions.delete', 'module' => 'Subscriptions'],

            // Settings
            ['name' => 'View Settings', 'slug' => 'settings.view', 'module' => 'Settings'],
            ['name' => 'Edit Settings', 'slug' => 'settings.edit', 'module' => 'Settings'],
        ];

        foreach ($permissions as $perm) {
            Permission::updateOrCreate(['slug' => $perm['slug']], $perm);
        }

        // Assign all permissions to Super Admin
        $superAdmin = Role::where('slug', 'super_admin')->first();
        if ($superAdmin) {
            $superAdmin->permissions()->sync(Permission::pluck('id'));
        }

        // Assign admin permissions
        $admin = Role::where('slug', 'admin')->first();
        if ($admin) {
            $adminPerms = Permission::whereIn('slug', [
                'dashboard.view', 'users.view', 'users.create', 'users.edit',
                'posters.view', 'posters.create', 'posters.edit', 'posters.delete',
                'subscriptions.view', 'subscriptions.create', 'subscriptions.edit', 'subscriptions.delete',
                'settings.view',
            ])->pluck('id');
            $admin->permissions()->sync($adminPerms);
        }

        // Assign staff permissions
        $staff = Role::where('slug', 'staff')->first();
        if ($staff) {
            $staffPerms = Permission::whereIn('slug', [
                'dashboard.view', 'posters.view', 'posters.create', 'posters.edit',
            ])->pluck('id');
            $staff->permissions()->sync($staffPerms);
        }

        // Assign customer permissions
        $customer = Role::where('slug', 'customer')->first();
        if ($customer) {
            $customerPerms = Permission::whereIn('slug', [
                'dashboard.view', 'posters.view',
            ])->pluck('id');
            $customer->permissions()->sync($customerPerms);
        }
    }
}
