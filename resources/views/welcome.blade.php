@extends('layouts.app')

@section('content')
<div class="grid grid-cols-1 lg:grid-cols-2">
    <!-- Sidebar -->
    @include('components.sidebar')

    <!-- Main Content -->
    <main class="relative flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div class="w-full max-w-md">
            @include('components.logo')
        </div>
    </main>
</div>

@include('components.auth-links')
@endsection