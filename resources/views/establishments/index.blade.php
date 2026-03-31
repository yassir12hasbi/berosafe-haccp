@extends('layouts.app')

@section('content')
<div class="p-6 lg:p-8">
    <!-- En-tête de la page -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
            <div class="flex items-center gap-3 mb-2">
                <div class="w-10 h-10 rounded-xl bg-[#1F65A7]/20 border border-[#1F65A7]/30 flex items-center justify-center">
                    <i class="fa-solid fa-building text-[#6EB7F5]"></i>
                </div>
                <h1 class="text-3xl font-extrabold text-[#2D6195]">Établissements</h1>
            </div>
            <p class="text-[#1D2309]">Gérez la liste complète des établissements enregistrés.</p>
        </div>
        <a href="{{ route('establishments.create') }}" class="mt-4 sm:mt-0 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#6ED17B] to-[#2A8734] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/40 transition-all">
            <i class="fa-solid fa-plus-circle"></i>
            Ajouter un établissement
        </a>
    </div>

    <!-- Carte des filtres -->
    <div class="glass-card rounded-2xl p-6 mb-8 border border-white/10">
        <form method="GET" action="{{ route('establishments.index') }}" class="flex flex-wrap gap-4">
            <div class="flex-1 min-w-[200px]">
                <label for="name" class="block text-xs font-bold uppercase tracking-[0.2em] text-[#1D2309] mb-2">Nom</label>
                <input 
                    type="text" 
                    id="name"
                    name="name"
                    value="{{ request('name') }}"
                    placeholder="Rechercher par nom..."
                    class="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1F65A7]/50 focus:border-transparent transition-all"
                >
            </div>
            <div class="min-w-[200px]">
                <label for="city" class="block text-xs font-bold uppercase tracking-[0.2em] text-[#1D2309] mb-2">Ville</label>
                <select id="city" name="city" class="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-[#2D6195] focus:outline-none focus:ring-2 focus:ring-[#1F65A7]/50 focus:border-transparent transition-all">
                    <option value="">Toutes les villes</option>
                    @foreach($cities ?? [] as $city)
                        <option value="{{ $city }}" {{ request('city') == $city ? 'selected' : '' }}>{{ $city }}</option>
                    @endforeach
                </select>
            </div>
            <div class="flex items-end gap-3">
                <button type="submit" class="rounded-xl bg-gradient-to-r from-[#1F65A7] to-[#13385E] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all">
                    <i class="fa-solid fa-filter mr-2"></i>Filtrer
                </button>
                <a href="{{ route('establishments.index') }}" class="rounded-xl bg-white/10 px-6 py-3 text-sm font-bold text-[#FF1635] hover:bg-white/20 transition-all">
                    <i class="fa-solid fa-rotate-left mr-2"></i>Réinitialiser
                </a>
            </div>
        </form>
    </div>

  <!-- Carte du tableau -->
<div class="glass-card rounded-2xl border border-white/10 overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full">
            <thead class="bg-slate-800/50 border-b border-white/10">
                <tr>
                    <th scope="col" class="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-white">ID</th>
                    <th scope="col" class="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-white">Nom</th>
                    <th scope="col" class="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-white">Type</th>
                    <th scope="col" class="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-white">Ville</th>
                    <th scope="col" class="relative px-6 py-4 text-right text-xs font-bold uppercase tracking-[0.2em] text-white">
                        <span>Actions</span>
                    </th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
                @forelse ($establishments as $establishment)
                    <tr class="hover:bg-white/5 transition-colors">
                        <!-- Données principales en blanc pur pour une lisibilité maximale -->
                        <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-blue">{{ $establishment->id }}</td>
                        <td class="whitespace-nowrap px-6 py-4 text-sm text-blue font-medium">{{ $establishment->name }}</td>
                        
                        <!-- Données secondaires en gris très clair pour créer une hiérarchie -->
                        <td class="whitespace-nowrap px-6 py-4 text-sm text-blue">{{ $establishment->type }}</td>
                        <td class="whitespace-nowrap px-6 py-4 text-sm text-blue">{{ $establishment->city }}</td>
                        
                        <!-- La colonne Actions garde ses couleurs distinctives -->
                        <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                            <div class="flex items-center justify-end gap-4">
                                <a href="{{ route('establishments.edit', $establishment->id) }}" class="text-[#6EB7F5] hover:text-[#4A9FE8] transition-colors" title="Modifier">
                                    <i class="fa-solid fa-pen-to-square text-lg"></i>
                                </a>
                                <form method="POST" action="{{ route('establishments.destroy', $establishment->id) }}" class="inline" onsubmit="return confirm('Êtes-vous sûr de vouloir supprimer cet établissement ?');">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit" class="text-red-400 hover:text-[#f70a0a] transition-colors" title="Supprimer">
                                        <i class="fa-solid fa-trash-can text-lg"></i>
                                    </button>
                                </form>
                            </div>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="5" class="px-6 py-16 text-center">
                            <div class="text-slate-400">
                                <i class="fa-solid fa-building-circle-xmark text-5xl mb-4"></i>
                                <h3 class="mt-2 text-lg font-semibold text-slate-300">Aucun établissement trouvé</h3>
                                <p class="mt-1 text-sm text-slate-500">Commencez par en ajouter un nouveau.</p>
                                <div class="mt-6">
                                    <a href="{{ route('establishments.create') }}" class="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#6ED17B] to-[#2A8734] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/40 transition-all">
                                        <i class="fa-solid fa-plus-circle"></i>
                                        Ajouter un établissement
                                    </a>
                                </div>
                            </div>
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>
</div>
@endsection