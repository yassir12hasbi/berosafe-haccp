@extends('layouts.app')

@section('content')
<div class="p-6 lg:p-8">
    <!-- En-tête de la page -->
    <div class="mb-8">
        <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-xl bg-[#1F65A7]/20 border border-[#1F65A7]/30 flex items-center justify-center">
                <i class="fa-solid fa-user-shield text-[#6EB7F5]"></i>
            </div>
            <h1 class="text-3xl font-extrabold text-black">Gestion des permissions</h1>
        </div>
        <p class="text-slate-400">Consultez et modifiez les rôles et permissions des utilisateurs.</p>
    </div>

    <!-- Carte des filtres -->
    <div class="glass-card rounded-2xl p-6 mb-8 border border-white/10">
        <form method="GET" action="{{ route('permissions.index') }}" class="flex flex-wrap gap-4 items-end">
            <div class="flex-1 min-w-[250px]">
                <label for="establishment_id" class="block text-xs font-bold uppercase tracking-[0.2em] text-slate-300 mb-2">Établissement</label>
                <select id="establishment_id" name="establishment_id" class="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#1F65A7]/50 focus:border-transparent transition-all">
                    <option value="">-- Tous les établissements --</option>
                    @foreach($establishments as $est)
                        <option value="{{ $est->id }}" {{ request('establishment_id') == $est->id ? 'selected' : '' }}>
                            {{ $est->name }}
                        </option>
                    @endforeach
                </select>
            </div>
            <div class="flex gap-3">
                <button type="submit" class="rounded-xl bg-gradient-to-r from-[#1F65A7] to-[#13385E] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all">
                    <i class="fa-solid fa-filter mr-2"></i>Filtrer
                </button>
                <a href="{{ route('permissions.index') }}" class="rounded-xl bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/20 transition-all">
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
                        <th scope="col" class="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Nom</th>
                        <th scope="col" class="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Email</th>
                        <th scope="col" class="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Rôle</th>
                        <th scope="col" class="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Établissement</th>
                        <th scope="col" class="relative px-6 py-4 text-right text-xs font-bold uppercase tracking-[0.2em] text-slate-300">
                            <span>Actions</span>
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    @forelse ($users as $user)
                        <tr class="hover:bg-white/5 transition-colors">
                            <td class="px-6 py-4 text-sm font-medium text-white">
                                {{ $user->first_name }} {{ $user->last_name }}
                            </td>
                            <td class="px-6 py-4 text-sm text-slate-300">
                                {{ $user->email }}
                            </td>
                            <td class="px-6 py-4 text-sm text-slate-300">
                                {{ $user->role->name ?? 'Aucun rôle' }}
                            </td>
                            <td class="px-6 py-4 text-sm text-slate-300">
                                {{ $user->establishment->name ?? 'Plateforme' }}
                            </td>
                            <td class="px-6 py-4 text-right text-sm font-medium">
                                <a href="{{ route('permissions.edit', $user->id) }}" class="inline-flex items-center gap-2 text-[#6EB7F5] hover:text-[#4A9FE8] transition-colors">
                                    <i class="fa-solid fa-user-gear"></i>
                                    Gérer
                                </a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="px-6 py-16 text-center">
                                <div class="text-slate-400">
                                    <i class="fa-solid fa-users-slash text-5xl mb-4"></i>
                                    <h3 class="mt-2 text-lg font-semibold text-slate-300">Aucun utilisateur trouvé</h3>
                                    <p class="mt-1 text-sm text-slate-500">Aucun utilisateur ne correspond aux filtres sélectionnés.</p>
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