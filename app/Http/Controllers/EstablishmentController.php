<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Establishment;

class EstablishmentController extends Controller
{

    // ✅ LISTE
    public function index()
    {
        $establishments = Establishment::all();
        return view('establishments.index', compact('establishments'));
    }

    // ✅ CREATE VIEW
    public function create()
    {
        return view('establishments.create');
    }

    // ✅ STORE
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'type' => 'required'
        ]);

        Establishment::create([
            'name' => $request->name,
            'type' => $request->type,
            'address' => $request->address,
            'city' => $request->city,
            'phone' => $request->phone,
            'email' => $request->email
        ]);

        return redirect()->route('establishments.index')
            ->with('success','Establishment created successfully');
    }

    // ✅ EDIT
    public function edit($id)
    {
        $establishment = Establishment::findOrFail($id);

        return view('establishments.edit', compact('establishment'));
    }

    // ✅ UPDATE
    public function update(Request $request, $id)
    {
        $establishment = Establishment::findOrFail($id);

        $request->validate([
            'name' => 'required',
            'type' => 'required'
        ]);

        $establishment->update([
            'name' => $request->name,
            'type' => $request->type,
            'address' => $request->address,
            'city' => $request->city,
            'phone' => $request->phone,
            'email' => $request->email
        ]);

        return redirect()->route('establishments.index')
            ->with('success','Establishment updated successfully');
    }

    // ✅ DELETE
    public function destroy($id)
    {
        $establishment = Establishment::findOrFail($id);

        $establishment->delete();

        return redirect()->route('establishments.index')
            ->with('success','Establishment deleted successfully');
    }
}