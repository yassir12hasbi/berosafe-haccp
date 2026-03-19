{{-- resources/views/components/user-form.blade.php --}}

@props([
    'action',
    'submitButtonText',
    'user' => null, // L'utilisateur est optionnel (null pour la création)
    'roles',
    'establishments'
])

<div class="px-4 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
            <h1 class="text-2xl font-semibold leading-6 text-gray-900">
                {{ $submitButtonText == 'Créer un utilisateur' ? 'Créer un utilisateur' : 'Modifier un utilisateur' }}
            </h1>
            <p class="mt-2 text-sm text-gray-700">
                {{ $submitButtonText == 'Créer un utilisateur' ? 'Remplissez les informations ci-dessous pour ajouter un nouvel utilisateur.' : 'Modifiez les informations de l\'utilisateur ci-dessous.' }}
            </p>
        </div>
    </div>

    <div class="mt-8">
        <form method="POST" action="{{ $action }}" class="space-y-6 bg-white px-6 py-8 shadow sm:rounded-lg">
            @csrf
            @if(isset($user))
                @method('PUT')
            @endif

            <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                {{-- Prénom --}}
                <div class="sm:col-span-3">
                    <label for="first_name" class="block text-sm font-medium leading-6 text-gray-900">Prénom</label>
                    <div class="mt-2">
                        <input type="text" name="first_name" id="first_name" value="{{ old('first_name', $user->first_name ?? '') }}" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-green sm:text-sm sm:leading-6 @error('first_name') ring-red-500 @enderror">
                        @error('first_name')
                            <p class="mt-2 text-sm text-red-600" id="first_name-error">{{ $message }}</p>
                        @enderror
                    </div>
                </div>

                {{-- Nom --}}
                <div class="sm:col-span-3">
                    <label for="last_name" class="block text-sm font-medium leading-6 text-gray-900">Nom</label>
                    <div class="mt-2">
                        <input type="text" name="last_name" id="last_name" value="{{ old('last_name', $user->last_name ?? '') }}" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-green sm:text-sm sm:leading-6 @error('last_name') ring-red-500 @enderror">
                        @error('last_name')
                            <p class="mt-2 text-sm text-red-600" id="last_name-error">{{ $message }}</p>
                        @enderror
                    </div>
                </div>

                {{-- Email --}}
                <div class="sm:col-span-4">
                    <label for="email" class="block text-sm font-medium leading-6 text-gray-900">Adresse email</label>
                    <div class="mt-2">
                        <input type="email" name="email" id="email" value="{{ old('email', $user->email ?? '') }}" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-green sm:text-sm sm:leading-6 @error('email') ring-red-500 @enderror">
                        @error('email')
                            <p class="mt-2 text-sm text-red-600" id="email-error">{{ $message }}</p>
                        @enderror
                    </div>
                </div>

                {{-- Mot de passe (uniquement en création) --}}
                @if(!isset($user))
                    <div class="sm:col-span-4">
                        <label for="password" class="block text-sm font-medium leading-6 text-gray-900">Mot de passe</label>
                        <div class="mt-2">
                            <input type="password" name="password" id="password" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-green sm:text-sm sm:leading-6 @error('password') ring-red-500 @enderror">
                            @error('password')
                                <p class="mt-2 text-sm text-red-600" id="password-error">{{ $message }}</p>
                            @enderror
                        </div>
                    </div>
                @endif

                {{-- Code mobile --}}
                <div class="sm:col-span-2">
                    <label for="code" class="block text-sm font-medium leading-6 text-gray-900">Code mobile</label>
                    <div class="mt-2">
                        <input type="text" name="code" id="code" value="{{ old('code', $user->code ?? '') }}" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-green sm:text-sm sm:leading-6 @error('code') ring-red-500 @enderror">
                        @error('code')
                            <p class="mt-2 text-sm text-red-600" id="code-error">{{ $message }}</p>
                        @enderror
                    </div>
                </div>

                {{-- Rôle --}}
                <div class="sm:col-span-3">
                    <label for="role_id" class="block text-sm font-medium leading-6 text-gray-900">Rôle</label>
                    <div class="mt-2">
                        <select name="role_id" id="role_id" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-brand-green sm:text-sm sm:leading-6">
                            @foreach($roles as $role)
                                <option value="{{ $role->id }}" {{ (isset($user) && $user->role_id == $role->id) ? 'selected' : '' }}>{{ $role->name }}</option>
                            @endforeach
                        </select>
                    </div>
                </div>

                {{-- Etablissement --}}
                <div class="sm:col-span-3">
                    <label for="establishment_id" class="block text-sm font-medium leading-6 text-gray-900">Etablissement</label>
                    <div class="mt-2">
                        <select name="establishment_id" id="establishment_id" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-brand-green sm:text-sm sm:leading-6">
                            @foreach($establishments as $est)
                                <option value="{{ $est->id }}" {{ (isset($user) && $user->establishment_id == $est->id) ? 'selected' : '' }}>{{ $est->name }}</option>
                            @endforeach
                        </select>
                    </div>
                </div>
            </div>

            {{-- Boutons d'action --}}
            <div class="mt-6 flex items-center justify-end gap-x-6">
                <a href="{{ route('users.index') }}" class="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-700">Annuler</a>
                <button type="submit" class="rounded-md bg-brand-green px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-green/500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green transition-colors">
                    {{ $submitButtonText }}
                </button>
            </div>
        </form>
    </div>
</div>