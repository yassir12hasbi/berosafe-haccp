@extends('layouts.app')

@section('content')
<div class="p-6 lg:p-8">
    <!-- En-tête de la page -->
    <div class="mb-8">
        <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-xl bg-[#1F65A7]/20 border border-[#1F65A7]/30 flex items-center justify-center">
                <i class="fa-solid fa-user-gear text-[#6EB7F5]"></i>
            </div>
            <h1 class="text-3xl font-extrabold text-white">Permissions de {{ $user->first_name }} {{ $user->last_name }}</h1>
        </div>
        <p class="text-slate-400">Sélectionnez les permissions à accorder à cet utilisateur.</p>
    </div>

    <!-- Carte du formulaire -->
    <div class="glass-card rounded-2xl p-6 lg:p-8 border border-white/10 max-w-4xl mx-auto">
        <form method="POST" action="{{ route('permissions.update', $user->id) }}">
            @csrf
            @method('PUT') <!-- Plus correct pour une mise à jour -->

            {{-- Tableau de correspondance entre les permissions et les icônes --}}
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

            <div class="space-y-2">
                @foreach($permissions as $permission)
                    <label class="flex items-center gap-4 p-4 rounded-xl cursor-pointer hover:bg-white/5 transition-all border border-transparent hover:border-white/10">
                        <!-- Checkbox personnalisé -->
                        <div class="relative">
                            <input
                                type="checkbox"
                                name="permissions[]"
                                value="{{ $permission->id }}"
                                {{ in_array($permission->id, $userPermissions) ? 'checked' : '' }}
                                class="peer sr-only"
                            >
                            <div class="w-5 h-5 border-2 border-slate-500 rounded-md peer-checked:border-[#1F65A7] peer-checked:bg-[#1F65A7] transition-all flex items-center justify-center">
                                <i class="fa-solid fa-check text-white text-xs opacity-0 peer-checked:opacity-100 transition-opacity"></i>
                            </div>
                        </div>
                        
                        <!-- Icône et Nom -->
                        <i class="fas {{ $iconMap[$permission->name] ?? 'fa-circle-question' }} text-slate-400 w-5 text-center text-lg"></i>
                        <span class="text-white font-medium capitalize">{{ str_replace('_', ' ', $permission->name) }}</span>
                    </label>
                @endforeach
            </div>

            <div class="mt-8 flex justify-end">
                <button type="submit" class="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#1F65A7] to-[#13385E] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all">
                    <i class="fa-solid fa-floppy-disk"></i>
                    Sauvegarder les permissions
                </button>
            </div>
        </form>
    </div>
</div>
@endsection