{{-- resources/views/components/supplier-form.blade.php --}}

@props([
    'action',
    'submitButtonText',
    'supplier' => null
])

<div class="px-4 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
            <h1 class="text-2xl font-semibold leading-6 text-gray-900">
                {{ $submitButtonText == 'Créer un fournisseur' ? 'Ajouter un fournisseur' : 'Modifier le fournisseur' }}
            </h1>
            <p class="mt-2 text-sm text-gray-700">
                {{ $submitButtonText == 'Créer un fournisseur' ? 'Remplissez les informations ci-dessous pour ajouter un nouveau fournisseur.' : 'Modifiez les informations du fournisseur ci-dessous.' }}
            </p>
        </div>
    </div>

    <div class="mt-8">
        <form method="POST" action="{{ $action }}" class="space-y-6 bg-white px-6 py-8 shadow sm:rounded-lg">
            @csrf
            @if(isset($supplier))
                @method('PUT')
            @endif

            <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                {{-- Nom --}}
                <div class="sm:col-span-3">
                    <label for="name" class="block text-sm font-medium leading-6 text-gray-900">Nom du fournisseur</label>
                    <div class="mt-2">
                        <input type="text" name="name" id="name" value="{{ old('name', $supplier->name ?? '') }}" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-green sm:text-sm sm:leading-6 @error('name') ring-red-500 @enderror">
                        @error('name')
                            <p class="mt-2 text-sm text-red-600" id="name-error">{{ $message }}</p>
                        @enderror
                    </div>
                </div>

                {{-- Téléphone --}}
                <div class="sm:col-span-3">
                    <label for="phone" class="block text-sm font-medium leading-6 text-gray-900">Téléphone</label>
                    <div class="mt-2">
                        <input type="text" name="phone" id="phone" value="{{ old('phone', $supplier->phone ?? '') }}" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-green sm:text-sm sm:leading-6 @error('phone') ring-red-500 @enderror">
                        @error('phone')
                            <p class="mt-2 text-sm text-red-600" id="phone-error">{{ $message }}</p>
                        @enderror
                    </div>
                </div>

                {{-- Email --}}
                <div class="sm:col-span-4">
                    <label for="email" class="block text-sm font-medium leading-6 text-gray-900">Email</label>
                    <div class="mt-2">
                        <input type="email" name="email" id="email" value="{{ old('email', $supplier->email ?? '') }}" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-green sm:text-sm sm:leading-6 @error('email') ring-red-500 @enderror">
                        @error('email')
                            <p class="mt-2 text-sm text-red-600" id="email-error">{{ $message }}</p>
                        @enderror
                    </div>
                </div>

                {{-- Adresse --}}
                <div class="sm:col-span-4">
                    <label for="address" class="block text-sm font-medium leading-6 text-gray-900">Adresse</label>
                    <div class="mt-2">
                        <input type="text" name="address" id="address" value="{{ old('address', $supplier->address ?? '') }}" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-green sm:text-sm sm:leading-6 @error('address') ring-red-500 @enderror">
                        @error('address')
                            <p class="mt-2 text-sm text-red-600" id="address-error">{{ $message }}</p>
                        @enderror
                    </div>
                </div>

                {{-- Ville --}}
                <div class="sm:col-span-2">
                    <label for="city" class="block text-sm font-medium leading-6 text-gray-900">Ville</label>
                    <div class="mt-2">
                        <input type="text" name="city" id="city" value="{{ old('city', $supplier->city ?? '') }}" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-green sm:text-sm sm:leading-6 @error('city') ring-red-500 @enderror">
                        @error('city')
                            <p class="mt-2 text-sm text-red-600" id="city-error">{{ $message }}</p>
                        @enderror
                    </div>
                </div>
            </div>

            <div class="mt-6 flex items-center justify-end gap-x-6">
                <a href="{{ route('suppliers.index') }}" class="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-700">Annuler</a>
                <button type="submit" class="rounded-md bg-brand-green px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-green/500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green transition-colors">
                    {{ $submitButtonText }}
                </button>
            </div>
        </form>
    </div>
</div>