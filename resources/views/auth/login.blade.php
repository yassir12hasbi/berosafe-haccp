@extends('layouts.guest')

@section('content')
<div class="w-full max-w-md">
    <!-- Carte de connexion "Glass" -->
    <div class="glass-card rounded-[28px] p-8 border border-white/10">
        <!-- Logo et Titre -->
        <div class="text-center mb-8">
            <div class="flex items-center justify-center gap-3 mb-4">
                <div class="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-xl">
                    <i class="fa-solid fa-shield-heart text-white"></i>
                </div>
                <div class="text-2xl font-extrabold tracking-wider leading-none">
                    <span class="text-[#6ED17B]">BERO</span><span class="text-[#6EB7F5]">CERT</span>
                </div>
            </div>
            <h2 class="text-2xl font-extrabold text-[#6ED17B]">Connexion à votre espace</h2>
            <p class="mt-2 text-sm text-[#6EB7F5]">Gérez votre établissement en toute simplicité</p>
        </div>

        <!-- Message de session (ex: "Vous êtes déconnecté") -->
        @if (session('status'))
            <div class="mb-4 p-4 rounded-2xl bg-green-500/20 border border-green-400/30">
                <p class="text-sm text-green-300">{{ session('status') }}</p>
            </div>
        @endif

        <!-- Formulaire de connexion -->
        <form method="POST" action="{{ route('login') }}">
            @csrf

            <!-- Email Address -->
            <div class="mb-6">
                <label for="email" class="block text-xs font-bold uppercase tracking-[0.2em] text-[#6ED17B] mb-2">
                    Adresse e-mail
                </label>
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <i class="fa-solid fa-envelope text-slate-400"></i>
                    </div>
                    <input id="email" name="email" type="email" value="{{ old('email') }}" required autofocus autocomplete="username"
                        class="pl-12 w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F65A7]/50 focus:border-transparent transition-all"
                        placeholder="nom@berocert.com">
                </div>
                @error('email')
                    <p class="mt-2 text-sm text-red-400">{{ $message }}</p>
                @enderror
            </div>

            <!-- Password -->
            <div class="mb-6">
                <label for="password" class="block text-xs font-bold uppercase tracking-[0.2em] text-[#6ED17B] mb-2">
                    Mot de passe
                </label>
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <i class="fa-solid fa-lock text-slate-400"></i>
                    </div>
                    <input id="password" name="password" type="password" required autocomplete="current-password"
                        class="pl-12 w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F65A7]/50 focus:border-transparent transition-all"
                        placeholder="••••••••">
                </div>
                @error('password')
                    <p class="mt-2 text-sm text-red-400">{{ $message }}</p>
                @enderror
            </div>

            <!-- Remember Me & Forgot Password -->
            <div class="flex items-center justify-between mb-6">
                <label for="remember_me" class="flex items-center">
                    <input id="remember_me" type="checkbox" name="remember"
                        class="rounded border-slate-600 bg-white/5 text-[#1F65A7] shadow-sm focus:ring-[#1F65A7] focus:ring-offset-0 focus:ring-offset-transparent">
                    <span class="ml-2 text-sm text-slate-300">Se souvenir de moi</span>
                </label>

                @if (Route::has('password.request'))
                    <a href="{{ route('password.request') }}" class="text-sm text-[#6EB7F5] hover:underline">
                        Mot de passe oublié ?
                    </a>
                @endif
            </div>

            <!-- Submit Button -->
            <button type="submit" class="w-full p-4 text-center font-bold text-white rounded-2xl bg-gradient-to-r from-[#1F65A7] to-[#13385E] shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all">
                Se connecter
            </button>
        </form>
    </div>
</div>
@endsection