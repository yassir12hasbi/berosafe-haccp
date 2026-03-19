{{-- resources/views/components/category-form.blade.php --}}

@props([
    'action',
    'submitButtonText',
    'category' => null
])

<div class="px-4 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
            <h1 class="text-2xl font-semibold leading-6 text-gray-900">
                {{ $submitButtonText == 'Créer une catégorie' ? 'Ajouter une catégorie' : 'Modifier la catégorie' }}
            </h1>
            <p class="mt-2 text-sm text-gray-700">
                {{ $submitButtonText == 'Créer une catégorie' ? 'Remplissez le nom ci-dessous pour ajouter une nouvelle catégorie.' : 'Modifiez le nom de la catégorie ci-dessous.' }}
            </p>
        </div>
    </div>

    <div class="mt-8">
        <form method="POST" action="{{ $action }}" class="space-y-6 bg-white px-6 py-8 shadow sm:rounded-lg">
            @csrf
            @if(isset($category))
                @method('PUT')
            @endif

            <div>
                <label for="name" class="block text-sm font-medium leading-6 text-gray-900">Nom de la catégorie</label>
                <div class="mt-2">
                    <input type="text" name="name" id="name" value="{{ old('name', $category->name ?? '') }}" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-green sm:text-sm sm:leading-6 @error('name') ring-red-500 @enderror">
                    @error('name')
                        <p class="mt-2 text-sm text-red-600" id="name-error">{{ $message }}</p>
                    @enderror
                </div>
            </div>

            <div class="mt-6 flex items-center justify-end gap-x-6">
                <a href="{{ route('categories.index') }}" class="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-700">Annuler</a>
                <button type="submit" class="rounded-md bg-brand-green px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-green/500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green transition-colors">
                    {{ $submitButtonText }}
                </button>
            </div>
        </form>
    </div>
</div>