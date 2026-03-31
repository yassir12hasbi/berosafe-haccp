<div class="mini-card rounded-3xl border border-[var(--bero-border)] bg-white p-5 transition-all">
    <div class="flex items-center justify-between mb-4">
        <div class="w-14 h-14 rounded-2xl icon-shell flex items-center justify-center text-2xl" style="color: {{ $iconColor ?? '#1F65A7' }}">
            <i class="fa-solid {{ $icon }}"></i>
        </div>
        <span class="text-xs font-bold px-3 py-1 rounded-full bg-{{ $badgeColor ?? 'green' }}-50 text-{{ $badgeColor ?? 'green' }}-600">
            {{ $badge }}
        </span>
    </div>
    <h4 class="font-extrabold text-[#13385E]">{{ $title }}</h4>
    <p class="text-sm text-slate-500 mt-2 leading-6">{{ $description }}</p>
    
    @if(isset($indicators))
        <div class="mt-4 space-y-3 text-sm">
            @foreach($indicators as $indicator)
                @if(isset($indicator['color']))
                    <div>
                        <div class="flex justify-between mb-1">
                            <span class="text-slate-500">{{ $indicator['label'] }}</span>
                            <span class="font-bold text-[#13385E]">{{ $indicator['value'] }}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width:{{ rtrim($indicator['value'], '%') }}; background-color: {{ $indicator['color'] }}"></div>
                        </div>
                    </div>
                @else
                    <div class="rounded-2xl bg-slate-50 p-3">
                        <p class="text-slate-500">{{ $indicator['label'] }}</p>
                        <p class="font-extrabold text-[#13385E] mt-1">{{ $indicator['value'] }}</p>
                    </div>
                @endif
            @endforeach
        </div>
    @endif
</div>