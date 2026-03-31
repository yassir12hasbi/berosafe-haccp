<div class="module-tile rounded-3xl border border-slate-200 bg-white p-5 transition-all">
    <div class="flex items-center justify-between mb-4">
        <div class="w-14 h-14 rounded-2xl icon-shell text-[#1F65A7] flex items-center justify-center text-2xl">
            <i class="fa-solid {{ $icon }}"></i>
        </div>
        <span class="text-xs font-bold px-3 py-1 rounded-full bg-green-50 text-green-700">Actif</span>
    </div>
    <h4 class="font-extrabold text-[#13385E]">{{ $title }}</h4>
    <p class="text-sm text-slate-500 mt-2 leading-6">{{ $description }}</p>
    <div class="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>{{ $fields }} champs</span>
        <span>{{ $roles }} rôles</span>
    </div>
</div>