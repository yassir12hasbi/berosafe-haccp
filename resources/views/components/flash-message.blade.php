{{-- resources/views/components/flash-message.blade.php --}}

@auth {{-- On affiche les messages seulement aux utilisateurs connectés --}}
    <div class="container mx-auto px-4">
        {{-- Message de Succès --}}
        @if(session()->has('success'))
            <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-md shadow-sm" role="alert">
                <p class="font-bold">Succès !</p>
                <p>{{ session('success') }}</p>
            </div>
        @endif

        {{-- Message d'Erreur --}}
        @if(session()->has('error'))
            <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md shadow-sm" role="alert">
                <p class="font-bold">Erreur !</p>
                <p>{{ session('error') }}</p>
            </div>
        @endif

        {{-- Message d'Avertissement --}}
        @if(session()->has('warning'))
            <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded-md shadow-sm" role="alert">
                <p class="font-bold">Attention !</p>
                <p>{{ session('warning') }}</p>
            </div>
        @endif

        {{-- Message d'Information --}}
        @if(session()->has('info'))
            <div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4 rounded-md shadow-sm" role="alert">
                <p class="font-bold">Information</p>
                <p>{{ session('info') }}</p>
            </div>
        @endif
    </div>
@endauth