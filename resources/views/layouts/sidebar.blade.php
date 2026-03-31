<aside class="w-[310px] bg-[#13385E] text-white p-6 flex flex-col justify-between shadow-2xl">
    <div>
        <!-- Logo -->
        <div class="flex items-center gap-3 mb-8">
            <div class="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-xl">
                <i class="fa-solid fa-shield-heart text-white"></i>
            </div>
            <div>
                <div class="text-xl font-extrabold tracking-wider leading-none">
                    <span class="text-[#6ED17B]">BER</span><span class="text-white">O</span><span class="text-[#6EB7F5]">CERT</span>
                </div>
                <p class="text-xs text-slate-300 mt-1">Admin établissement</p>
            </div>
        </div>

        <!-- Session info -->
        <div class="mb-6 p-4 rounded-3xl bg-white/5 border border-white/10">
            <p class="text-[11px] uppercase tracking-[0.25em] text-slate-300 font-bold mb-3">Session active</p>
            <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-2xl bg-[#1F65A7]/40 flex items-center justify-center">
                    <i class="fa-solid fa-user-gear"></i>
                </div>
                <div>
                    <p class="font-bold">{{ auth()->user()->name }}</p>
                    <p class="text-sm text-slate-300">{{ auth()->user()->establishment->name ?? 'Établissement non défini' }}</p>
                </div>
            </div>
        </div>

        <!-- Support button -->
        <a href="mailto:yassir12hasbi@gmail.com?subject={{ urlencode('Demande de support de la part de ' . auth()->user()->name) }}&body={{ urlencode("Bonjour l'équipe de BEROCERT,\n\nJe vous contacte pour la raison suivante :\n\n\n\nCordialement,\n" . auth()->user()->name . "\n" . auth()->user()->email) }}" class="mb-6 w-full rounded-3xl border border-white/10 bg-white/5 p-4 text-left text-white transition-all hover:bg-white/10 block">
            <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-2xl bg-[#2A8734]/20 flex items-center justify-center">
                    <i class="fa-solid fa-headset"></i>
                </div>
                <div>
                    <p class="text-[11px] uppercase tracking-[0.25em] text-slate-300 font-bold mb-1">Support</p>
                    <p class="font-bold">Contacter le support BEROCERT</p>
                </div>
            </div>
        </a>

        <!-- LOGOUT BUTTON -->
        <form action="{{ route('logout') }}" method="POST" class="mb-6" onsubmit="return confirm('Êtes-vous sûr de vouloir vous déconnecter ?');">
            @csrf
            <button type="submit" class="w-full rounded-3xl border border-red-400/30 bg-red-500/20 p-4 text-left text-white transition-all hover:bg-red-500/30">
                <div class="flex items-center gap-3">
                    <div class="w-11 h-11 rounded-2xl bg-red-500/30 flex items-center justify-center">
                        <i class="fa-solid fa-right-from-bracket"></i>
                    </div>
                    <div>
                        <p class="text-[11px] uppercase tracking-[0.25em] text-slate-300 font-bold mb-1">Session</p>
                        <p class="font-bold">Se déconnecter</p>
                    </div>
                </div>
            </button>
        </form>

        <!-- Navigation menu -->
        @include('partials.navigation-menu')
    </div>

    <!-- Bottom card -->
    <div class="rounded-3xl p-4 bg-gradient-to-br from-[#1F65A7] to-[#2A8734] shadow-xl">
        <p class="text-xs uppercase tracking-[0.2em] text-white/80 font-bold mb-2">Aperçu des accès</p>
        <p class="text-sm leading-6 text-white/95">Prévisualisation des modules visibles sur mobile selon le rôle attribué.</p>
    </div>
</aside>