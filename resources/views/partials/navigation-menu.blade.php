<nav class="space-y-2 text-sm">
    <a class="nav-item {{ request()->routeIs('dashboard') ? 'active' : '' }} flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10 transition-all" href="{{ route('dashboard') }}">
        <i class="fa-solid fa-grid-2"></i><span>Dashboard global</span>
    </a>
    
    <!-- Modules submenu -->
    <div class="space-y-2">
        <button id="modules-toggle" onclick="toggleModulesMenu()" class="nav-item w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-transparent text-slate-200 hover:bg-white/5 transition-all text-left">
            <span class="flex items-center gap-3">
                <i class="fa-solid fa-layer-group"></i><span>Modules</span>
            </span>
            <i id="modules-chevron" class="fa-solid fa-chevron-down text-xs transition-transform"></i>
        </button>
        <div id="modules-menu" class="hidden ml-4 space-y-2 border-l border-white/10 pl-4">
            @foreach([
                'Contrôle à la réception',
                'Impression des étiquettes',
                'Suivi de traçabilité',
                'Nettoyage & Désinfection',
                'Températures des frigos',
                'Désinfection Fruits & Légumes',
                'Suivi de cuisson',
                'Suivi de refroidissement',
                'Décongélation',
                'Suivi de réchauffage',
                'Températures des buffets',
                'Lave-vaisselle',
                'Machines à glaçons',
                'Huiles de friture',
                'Hygiène personnel & visiteurs',
                'Accès aux enregistrements'
            ] as $module)
                <a class="block rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5 transition-all" href="#">{{ $module }}</a>
            @endforeach
        </div>
    </div>
    
    <!-- Other menu items -->
    <a class="nav-item flex items-center gap-3 px-4 py-3 rounded-2xl border border-transparent text-slate-200 hover:bg-white/5 transition-all {{ request()->routeIs('permissions.*') ? 'active' : '' }}"" href="{{ route('permissions.index') }}">
        <i class="fa-solid fa-user-lock"></i><span>Permissions & rôles</span>
    </a>
    @if(auth()->check() && auth()->user()->role->name == 'super_admin')
    <a class="nav-item flex items-center gap-3 px-4 py-3 rounded-2xl border border-transparent text-slate-200 hover:bg-white/5 transition-all {{ request()->routeIs('establishments.*') ? 'active' : '' }}" href="{{ route('establishments.index') }}">
        <i class="fa-solid fa-hotel"></i><span>Établissement</span>
    </a>
@endif
    <a class="nav-item flex items-center gap-3 px-4 py-3 rounded-2xl border border-transparent text-slate-200 hover:bg-white/5 transition-all" href="#">
        <i class="fa-solid fa-mobile-screen-button"></i><span>Aperçu application mobile</span>
    </a>
    
    <!-- Disabled items -->
    <a class="nav-item flex items-center gap-3 px-4 py-3 rounded-2xl border border-transparent text-slate-400 bg-white/0 opacity-70 cursor-not-allowed pointer-events-none" href="#" aria-disabled="true">
        <i class="fa-solid fa-trash-can-arrow-up"></i><span>Suivi des déchets</span>
    </a>
    <a class="nav-item flex items-center gap-3 px-4 py-3 rounded-2xl border border-transparent text-slate-400 bg-white/0 opacity-70 cursor-not-allowed pointer-events-none" href="#" aria-disabled="true">
        <i class="fa-solid fa-triangle-exclamation"></i><span>Maîtrise des allergènes</span>
    </a>
    <a class="nav-item flex items-center gap-3 px-4 py-3 rounded-2xl border border-transparent text-slate-400 bg-white/0 opacity-70 cursor-not-allowed pointer-events-none" href="#" aria-disabled="true">
        <i class="fa-solid fa-clipboard-check"></i><span>Audit interne</span>
    </a>
    <a class="nav-item flex items-center gap-3 px-4 py-3 rounded-2xl border border-transparent text-slate-200 hover:bg-white/5 transition-all" href="#">
        <i class="fa-solid fa-clock-rotate-left"></i><span>Journal d\'activité</span>
    </a>
</nav>