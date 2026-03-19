<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
{
    $role = \App\Models\Role::firstOrCreate(['name' => 'super_admin']);

    \App\Models\User::create([
        'first_name' => 'Super',
        'last_name' => 'Admin',
        'email' => 'superadmin@berosafe.com',
        'password' => bcrypt('SuperPassword123'), // mot de passe par défaut
        'code' => 'SA0001',
        'role_id' => $role->id,
        'establishment_id' => null,
        'status' => true
    ]);
}
}
