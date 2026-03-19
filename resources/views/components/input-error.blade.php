<!-- resources/views/components/input-error.blade.php -->

@props(['messages'])

@if ($messages)
    <div {{ $attributes->merge(['class' => 'text-sm text-red-600']) }}>
        @foreach ($messages as $message)
            <p>{{ $message }}</p>
        @endforeach
    </div>
@endif