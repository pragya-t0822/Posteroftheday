<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'Super Admin', 'slug' => 'super_admin', 'description' => 'Full system access with permission management'],
            ['name' => 'Admin', 'slug' => 'admin', 'description' => 'Administrative access'],
            ['name' => 'Staff', 'slug' => 'staff', 'description' => 'Staff level access'],
            ['name' => 'Customer', 'slug' => 'customer', 'description' => 'Customer level access'],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['slug' => $role['slug']], $role);
        }
    }
}
