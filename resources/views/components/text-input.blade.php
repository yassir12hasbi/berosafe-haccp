<!-- resources/views/components/text-input.blade.php -->

@props(['disabled' => false])

<input
    {{ $attributes->merge([
        'class' => 'border-gray-300 focus:border-brand-blue focus:ring-brand-blue rounded-md shadow-sm ' .
                    ($disabled ? 'bg-gray-100' : 'bg-white')
    ]) }}
    {{ $disabled ? 'disabled' : '' }}
>