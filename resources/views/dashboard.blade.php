@extends('layouts.app')

@section('content')
<div class="p-6">
    <!-- Le titre est maintenant sombre pour ressortir sur la carte blanche -->
    <h2 class="text-3xl font-bold text-slate-800 mb-8">Tableau de Bord</h2>

    <!-- Grille plus responsive : 1 colonne sur mobile, 2 sur tablette, 3 sur grand écran -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <!-- Carte des Utilisateurs -->
        <div class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-slate-100">
            <div class="flex items-center">
                <div class="p-3 bg-emerald-100 rounded-lg">
                    <!-- Icône Utilisateur -->
                    <svg class="w-6 h-6 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    </svg>
                </div>
                <div class="ml-4">
                    <h3 class="text-sm font-medium text-gray-500">Utilisateurs</h3>
                    <!-- Le chiffre principal est en vert -->
                    <p class="text-2xl font-bold text-brand-green">{{ $usersCount }}</p>
                </div>
            </div>
        </div>

        <!-- Carte des Établissements -->
        <div class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-slate-100">
            <div class="flex items-center">
                <div class="p-3 bg-cyan-100 rounded-lg">
                    <!-- Icône Bâtiment -->
                    <svg class="w-6 h-6 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                </div>
                <div class="ml-4">
                    <h3 class="text-sm font-medium text-gray-500">Établissements</h3>
                    <p class="text-2xl font-bold text-brand-green">{{ $establishmentsCount }}</p>
                </div>
            </div>
        </div>

        <!-- Carte des Produits -->
        <div class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-slate-100">
            <div class="flex items-center">
                <div class="p-3 bg-purple-100 rounded-lg">
                    <!-- Icône Boîte -->
                    <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                </div>
                <div class="ml-4">
                    <h3 class="text-sm font-medium text-gray-500">Produits</h3>
                    <p class="text-2xl font-bold text-brand-green">{{ $productsCount }}</p>
                </div>
            </div>
        </div>

        <!-- Carte des Fournisseurs -->
        <div class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-slate-100">
            <div class="flex items-center">
                <div class="p-3 bg-orange-100 rounded-lg">
                    <!-- Icône Camion -->
                    <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path>
                    </svg>
                </div>
                <div class="ml-4">
                    <h3 class="text-sm font-medium text-gray-500">Fournisseurs</h3>
                    <p class="text-2xl font-bold text-brand-green">{{ $suppliersCount }}</p>
                </div>
            </div>
        </div>

        <!-- Carte des Catégories -->
        <div class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-slate-100">
            <div class="flex items-center">
                <div class="p-3 bg-pink-100 rounded-lg">
                    <!-- Icône Grille -->
                    <svg class="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                    </svg>
                </div>
                <div class="ml-4">
                    <h3 class="text-sm font-medium text-gray-500">Catégories</h3>
                    <p class="text-2xl font-bold text-brand-green">{{ $categoriesCount }}</p>
                </div>
            </div>
        </div>

    </div>
</div>
@endsection