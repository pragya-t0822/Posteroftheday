<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            ['name' => 'Super Admin', 'email' => 'superadmin@posteroftheday.com', 'role' => 'super_admin'],
            ['name' => 'Admin User',  'email' => 'admin@posteroftheday.com',      'role' => 'admin'],
            ['name' => 'Staff User',  'email' => 'staff@posteroftheday.com',      'role' => 'staff'],
            ['name' => 'Customer',    'email' => 'customer@posteroftheday.com',   'role' => 'customer'],
        ];

        foreach ($accounts as $account) {
            $role = Role::where('slug', $account['role'])->first();

            User::updateOrCreate(
                ['email' => $account['email']],
                [
                    'name'     => $account['name'],
                    'password' => Hash::make('password'),
                    'role_id'  => $role?->id,
                ]
            );
        }
    }
}
