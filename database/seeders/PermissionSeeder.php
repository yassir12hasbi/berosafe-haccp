<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
{
    $permissions = [
        ['name' => 'reception'],
        ['name' => 'temperature'],
        ['name' => 'cleaning'],
        ['name' => 'cooling'],
        ['name' => 'reheating'],
        ['name' => 'traceability'],
        ['name' => 'labels'],
        ['name' => 'disinfection'],
        ['name' => 'hygiene'],
    ];

    foreach ($permissions as $permission) {
        \App\Models\Permission::create($permission);
    }
}
}
