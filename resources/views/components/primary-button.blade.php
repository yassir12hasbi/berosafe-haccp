<!-- resources/views/components/primary-button.blade.php -->

@props(['disabled' => false])

<button
    {{ $attributes->merge([
        'class' => 'inline-flex items-center px-4 py-2 bg-brand-green border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest ' .
                    ($disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-green-600 active:bg-green-700 focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 transition ease-in-out duration-150'),
    ]) }}
    {{ $disabled ? 'disabled' : '' }}
>
    {{ $slot }}
</button>