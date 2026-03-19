<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Permission;

class PermissionController extends Controller
{

    // Liste des users pour gérer leurs permissions
  public function index()
{
    // Récupérer uniquement les users avec role 'admin' ou 'employee'
    $users = User::with('role')
        ->whereHas('role', function($query){
            $query->whereIn('name', ['admin','employee']); // exactement comme dans la table roles
        })
        ->get();

    return view('permissions.index', compact('users'));
}


    // Afficher permissions d'un user
    public function edit($user_id)
{
    $user = User::findOrFail($user_id);

    $permissions = Permission::all();

    $userPermissions = $user->permissions->pluck('id')->toArray();

    return view('permissions.edit', compact('user','permissions','userPermissions'));
}

public function update(Request $request, $user_id)
{
    $user = User::findOrFail($user_id);

    $user->permissions()->sync($request->permissions ?? []);

    return redirect()->back()->with('success','Permissions updated');
}

}