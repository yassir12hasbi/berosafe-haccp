@extends('layouts.app')

@section('title', 'Dashboard - BEROCERT Admin')

@section('page-title', 'Pilotage global de l\'établissement')

@section('content')
<section class="p-8 space-y-8">
    <!-- KPI Cards -->
    @include('partials.kpi-cards')

    <div class="grid grid-cols-12 gap-6">
        <!-- Colonne principale -->
        <div class="col-span-8 space-y-6">
            <!-- Indicateurs métier -->
            <div class="glass-card rounded-[28px] p-6 border border-white">
                <div class="flex items-center justify-between mb-5">
                    <div>
                        <p class="text-sm font-bold uppercase tracking-[0.2em] text-[#1F65A7]">Indicateurs métier</p>
                        <h3 class="text-2xl font-extrabold text-[#13385E] mt-1">Vision pertinente à partir des modules mobiles</h3>
                    </div>
                    <button class="px-4 py-2 rounded-2xl bg-slate-100 text-[#13385E] font-bold">
                        Exporter le tableau de bord
                    </button>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    @include('partials.indicator-card', [
                        'icon' => 'fa-temperature-low',
                        'iconColor' => '#1F65A7',
                        'title' => 'Températures critiques',
                        'description' => 'Frigos, buffets, décongélation, refroidissement et réchauffage.',
                        'badge' => '3 écarts',
                        'badgeColor' => 'red',
                        'indicators' => [
                            ['label' => 'Buffets chauds conformes', 'value' => '87%', 'color' => '#1F65A7'],
                            ['label' => 'Décongélation maîtrisée', 'value' => '94%', 'color' => '#2A8734']
                        ]
                    ])

                    @include('partials.indicator-card', [
                        'icon' => 'fa-gears',
                        'iconColor' => '#2A8734',
                        'title' => 'Équipements sensibles',
                        'description' => 'Lave-vaisselle, machines à glaçons et points critiques associés.',
                        'badge' => '2 contrôles en retard',
                        'badgeColor' => 'amber',
                        'indicators' => [
                            ['label' => 'Lave-vaisselle', 'value' => '98%'],
                            ['label' => 'Glaçons', 'value' => '91%']
                        ]
                    ])
                </div>
            </div>

            <!-- Modules de l'application -->
            <div class="glass-card rounded-[28px] p-6 border border-white">
                <div class="flex items-center justify-between mb-5">
                    <div>
                        <p class="text-sm font-bold uppercase tracking-[0.2em] text-[#1F65A7]">Modules de l\'application</p>
                        <h3 class="text-2xl font-extrabold text-[#13385E] mt-1">Paramétrage fonctionnel</h3>
                    </div>
                    <button class="px-4 py-2 rounded-2xl bg-slate-100 text-[#13385E] font-bold">
                        Gérer tous les modules
                    </button>
                </div>

                <div class="grid grid-cols-3 gap-4">
                    @include('partials.module-tile', [
                        'icon' => 'fa-temperature-half',
                        'title' => 'Températures & process',
                        'description' => 'Frigos, buffets, décongélation, réchauffage, refroidissement et cuisson.',
                        'fields' => 14,
                        'roles' => 5
                    ])

                    @include('partials.module-tile', [
                        'icon' => 'fa-kitchen-set',
                        'title' => 'Équipements',
                        'description' => 'Lave-vaisselle, glaçons, nettoyage, désinfection et réception.',
                        'fields' => 11,
                        'roles' => 4
                    ])

                    @include('partials.module-tile', [
                        'icon' => 'fa-qrcode',
                        'title' => 'Traçabilité',
                        'description' => 'Étiquetage, suivi des lots et gestion des DLC.',
                        'fields' => 8,
                        'roles' => 3
                    ])
                </div>
            </div>
        </div>

        <!-- Colonne latérale -->
        <div class="col-span-4 space-y-6">
            <!-- Aperçu mobile -->
            @include('partials.mobile-preview')

            <!-- Permissions -->
            @include('partials.permissions-list')

            <!-- Activité récente -->
            @include('partials.recent-activity')
        </div>
    </div>
</section>
@endsection