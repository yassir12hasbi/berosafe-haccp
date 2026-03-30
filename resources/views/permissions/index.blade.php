@extends('layouts.app')

@section('header')
    <h2 class="text-xl font-semibold leading-tight text-gray-800">
        Gestion des permissions
    </h2>
@endsection

@section('content')
<div class="py-12">
    <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">

        <!-- 🔍 FILTRE -->
        <div class="mb-6 bg-white p-4 shadow rounded">
            <form method="GET" class="flex gap-4 items-center">

                <select name="establishment_id" class="border rounded p-2">
                    <option value="">-- Tous les établissements --</option>
                    @foreach($establishments as $est)
                        <option value="{{ $est->id }}"
                            {{ request('establishment_id') == $est->id ? 'selected' : '' }}>
                            {{ $est->name }}
                        </option>
                    @endforeach
                </select>

                <button type="submit" class="bg-brand-green text-white px-4 py-2 rounded">
                    Filtrer
                </button>

                <a href="{{ route('permissions.index') }}" class="text-gray-600 underline">
                    Reset
                </a>
            </form>
        </div>

        <!-- TABLE -->
        <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div class="p-6 bg-white border-b border-gray-200">

                <table class="w-full border-collapse">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="border p-2 text-left">Nom</th>
                            <th class="border p-2 text-left">Email</th>
                            <th class="border p-2 text-left">Rôle</th>
                            <th class="border p-2 text-left">Établissement</th>
                            <th class="border p-2 text-left">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        @forelse ($users as $user)
                            <tr>
                                <td class="border p-2">
                                    {{ $user->first_name }} {{ $user->last_name }}
                                </td>

                                <td class="border p-2">
                                    {{ $user->email }}
                                </td>

                                <td class="border p-2">
                                    {{ $user->role->name ?? 'Aucun rôle' }}
                                </td>

                                <td class="border p-2">
                                    {{ $user->establishment->name ?? 'Platform' }}
                                </td>

                                <td class="border p-2">
                                    <a href="{{ route('permissions.edit', $user->id) }}"
                                       class="text-blue-600 hover:underline">
                                        Gérer permissions
                                    </a>
                                </td>
                            </tr>

                        @empty
                            <tr>
                                <td colspan="5" class="text-center p-4 text-gray-500">
                                    Aucun utilisateur trouvé
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>

            </div>
        </div>
    </div>
</div>
@endsection