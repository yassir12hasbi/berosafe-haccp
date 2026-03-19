<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Role;
use App\Models\Establishment;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{

    public function index()
    {
        $users = User::with('role','establishment')->get();
        return view('users.index', compact('users'));
    }

    public function create()
    {
        $user = Auth::user();

        if(!$user){
            abort(403);
        }

        if($user->role->name == 'super_admin'){
            $roles = Role::all();
        }
        elseif($user->role->name == 'admin'){
            $roles = Role::where('name','employee')->get();
        }
        else{
            abort(403);
        }

        $establishments = Establishment::all();

        return view('users.create', compact('roles','establishments'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'code' => 'required|unique:users',
            'role_id' => 'required|exists:roles,id'
        ]);

        $user = Auth::user();
        $role = Role::findOrFail($request->role_id);

        // sécurité
        if($user->role->name == 'admin' && $role->name != 'employee'){
            abort(403);
        }

        User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'code' => $request->code,
            'role_id' => $request->role_id,
            'establishment_id' => $request->establishment_id,
            'status' => 1
        ]);

        return redirect()->route('users.index')->with('success','User created successfully');
    }

    // ✅ EDIT
    public function edit($id)
    {
        $user = User::findOrFail($id);
        $authUser = Auth::user();

        if($authUser->role->name == 'super_admin'){
            $roles = Role::all();
        }
        elseif($authUser->role->name == 'admin'){
            $roles = Role::where('name','employee')->get();
        }
        else{
            abort(403);
        }

        $establishments = Establishment::all();

        return view('users.edit', compact('user','roles','establishments'));
    }

    // ✅ UPDATE
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,'.$id,
            'code' => 'required|unique:users,code,'.$id,
            'role_id' => 'required|exists:roles,id'
        ]);

        $authUser = Auth::user();
        $role = Role::findOrFail($request->role_id);

        if($authUser->role->name == 'admin' && $role->name != 'employee'){
            abort(403);
        }

        $data = [
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'code' => $request->code,
            'role_id' => $request->role_id,
            'establishment_id' => $request->establishment_id,
        ];

        // si password rempli
        if($request->password){
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return redirect()->route('users.index')->with('success','User updated successfully');
    }

    // ✅ DELETE
    public function destroy($id)
    {
        $user = User::findOrFail($id);

        // éviter suppression super admin
        if($user->role->name == 'super_admin'){
            abort(403);
        }

        $user->delete();

        return redirect()->route('users.index')->with('success','User deleted successfully');
    }

}