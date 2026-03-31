<header class="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-8 py-5">
    <div class="flex items-center justify-between gap-6">
        <div>
            <p class="text-sm font-bold text-[#1F65A7] uppercase tracking-[0.25em]">Administration web</p>
            <h1 class="text-3xl font-extrabold text-[#13385E] mt-1">@yield('page-title', 'Pilotage global de l\'établissement')</h1>
        </div>
        <div class="flex items-center gap-3">
            <div class="relative">
                <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input class="w-80 rounded-2xl border border-slate-200 bg-white px-12 py-3 outline-none focus:border-[#1F65A7]" placeholder="Rechercher un module, un rôle ou un indicateur..." />
            </div>
            <button class="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-[#13385E] shadow-sm">
                <i class="fa-solid fa-bell"></i>
            </button>
            <button class="px-5 h-12 rounded-2xl bg-[#13385E] text-white font-bold shadow-lg shadow-blue-100">
                Configurer les accès
            </button>
        </div>
    </div>
</header>