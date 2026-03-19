{{-- resources/views/components/product-form.blade.php --}}

@props([
    'action',
    'submitButtonText',
    'product' => null,
    'categories',
    'suppliers'
])

<div class="px-4 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
            <h1 class="text-2xl font-semibold leading-6 text-gray-900">
                {{ $submitButtonText == 'Créer un produit' ? 'Ajouter un produit' : 'Modifier le produit' }}
            </h1>
            <p class="mt-2 text-sm text-gray-700">
                {{ $submitButtonText == 'Créer un produit' ? 'Remplissez les informations ci-dessous pour ajouter un nouveau produit.' : 'Modifiez les informations du produit ci-dessous.' }}
            </p>
        </div>
    </div>

    <div class="mt-8">
        <form method="POST" action="{{ $action }}" class="space-y-6 bg-white px-6 py-8 shadow sm:rounded-lg">
            @csrf
            @if(isset($product))
                @method('PUT')
            @endif

            <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                {{-- Nom --}}
                <div class="sm:col-span-4">
                    <label for="name" class="block text-sm font-medium leading-6 text-gray-900">Nom du produit</label>
                    <div class="mt-2">
                        <input type="text" name="name" id="name" value="{{ old('name', $product->name ?? '') }}" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-green sm:text-sm sm:leading-6 @error('name') ring-red-500 @enderror">
                        @error('name')
                            <p class="mt-2 text-sm text-red-600" id="name-error">{{ $message }}</p>
                        @enderror
                    </div>
                </div>

                {{-- Prix --}}
                <div class="sm:col-span-2">
                    <label for="price" class="block text-sm font-medium leading-6 text-gray-900">Prix (DH)</label>
                    <div class="mt-2">
                        <input type="number" name="price" id="price" value="{{ old('price', $product->price ?? '') }}" step="0.01" min="0" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-green sm:text-sm sm:leading-6 @error('price') ring-red-500 @enderror">
                        @error('price')
                            <p class="mt-2 text-sm text-red-600" id="price-error">{{ $message }}</p>
                        @enderror
                    </div>
                </div>

                {{-- Catégorie --}}
                <div class="sm:col-span-3">
                    <label for="category_id" class="block text-sm font-medium leading-6 text-gray-900">Catégorie</label>
                    <div class="mt-2">
                        <select name="category_id" id="category_id" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-brand-green sm:text-sm sm:leading-6 @error('category_id') ring-red-500 @enderror">
                            <option value="">Sélectionner une catégorie</option>
                            @foreach($categories as $category)
                                <option value="{{ $category->id }}" {{ (isset($product) && $product->category_id == $category->id) ? 'selected' : '' }}>
                                    {{ $category->name }}
                                </option>
                            @endforeach
                        </select>
                        @error('category_id')
                            <p class="mt-2 text-sm text-red-600" id="category_id-error">{{ $message }}</p>
                        @enderror
                    </div>
                </div>

                {{-- Fournisseur --}}
                <div class="sm:col-span-3">
                    <label for="supplier_id" class="block text-sm font-medium leading-6 text-gray-900">Fournisseur</label>
                    <div class="mt-2">
                        <select name="supplier_id" id="supplier_id" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-brand-green sm:text-sm sm:leading-6 @error('supplier_id') ring-red-500 @enderror">
                            <option value="">Sélectionner un fournisseur</option>
                            @foreach($suppliers as $supplier)
                                <option value="{{ $supplier->id }}" {{ (isset($product) && $product->supplier_id == $supplier->id) ? 'selected' : '' }}>
                                    {{ $supplier->name }}
                                </option>
                            @endforeach
                        </select>
                        @error('supplier_id')
                            <p class="mt-2 text-sm text-red-600" id="supplier_id-error">{{ $message }}</p>
                        @enderror
                    </div>
                </div>
            </div>

            <div class="mt-6 flex items-center justify-end gap-x-6">
                <a href="{{ route('products.index') }}" class="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-700">Annuler</a>
                <button type="submit" class="rounded-md bg-brand-green px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-green/500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green transition-colors">
                    {{ $submitButtonText }}
                </button>
            </div>
        </form>
    </div>
</div>