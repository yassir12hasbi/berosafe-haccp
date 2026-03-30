{{-- On indique que cette vue hérite du layout principal --}}
@extends('layouts.app')

{{-- On définit la section pour l'en-tête de la page --}}
@section('header')
    <h2 class="text-xl font-semibold leading-tight text-gray-800">
        Permissions : {{ $user->name }}
    </h2>
@endsection


{{-- On définit la section pour le contenu principal de la page --}}
@section('content')
    <div class="py-12">
        <div class="max-w-4xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6 bg-white border-b border-gray-200">
                    <form method="POST" action="{{ route('permissions.update', $user->id) }}">
                        @csrf

                        {{-- NOUVEAU : Tableau de correspondance entre les permissions et les icônes --}}
                        <?php
                        $iconMap = [
                            'reception' => 'fa-truck-ramp-box',
                            'temperature' => 'fa-temperature-half',
                            'cleaning' => 'fa-broom',
                            'cooling' => 'fa-snowflake',
                            'reheating' => 'fa-fire',
                            'traceability' => 'fa-barcode',
                            'labels' => 'fa-tag',
                            'disinfection' => 'fa-shield-virus',
                            'hygiene' => 'fa-hands-washing',
                        ];
                        ?>

                        @foreach($permissions as $permission)
                            <div class="mb-2">
                                <label class="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="permissions[]"
                                        value="{{ $permission->id }}"
                                        {{ in_array($permission->id, $userPermissions) ? 'checked' : '' }}
                                        class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    >
                                    
                                    {{-- NOUVEAU : Affichage de l'icône et du nom --}}
                                    <i class="fas {{ $iconMap[$permission->name] ?? 'fa-question-circle' }} text-gray-600 w-5 text-center"></i>
                                    <span class="text-gray-700">{{ $permission->name }}</span>
                                </label>
                            </div>
                        @endforeach

                        <button type="submit" class="mt-6 px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Sauvegarder
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection