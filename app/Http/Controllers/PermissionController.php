<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Permission;

class PermissionController extends Controller
{

    // Liste des users pour gérer leurs permissions
  public function index(Request $request)
{
    $query = User::with('role', 'establishment');

    // Filtrer seulement admin + employee
    $query->whereHas('role', function ($q) {
        $q->whereIn('name', ['admin', 'employee']);
    });

    // 🔥 FILTRE PAR ETABLISSEMENT
    if ($request->establishment_id) {
        $query->where('establishment_id', $request->establishment_id);
    }

    $users = $query->get();

    // 🔥 récupérer liste établissements pour select
    $establishments = \App\Models\Establishment::all();

    return view('permissions.index', compact('users', 'establishments'));
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