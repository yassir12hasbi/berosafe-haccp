<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('app.name', 'Laravel') }}</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />
    <!-- Dans resources/views/layouts/app.blade.php, à l'intérieur de <head> -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <!-- Scripts -->
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<!-- On utilise notre couleur de fond personnalisée -->
<body class="font-sans antialiased bg-page-bg">
    <div class="min-h-screen">
        <!-- Message flash (si vous l'utilisez) -->
        <x-flash-message />

        <!-- Navigation -->
        @include('layouts.navigation')

        <!-- En-tête de page (optionnel, comme le titre "Dashboard") -->
        @isset($header)
            <header class="bg-white shadow-sm mb-8">
                <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    {{ $header }}
                    
                </div>
            </header>
        @endisset

        <!-- Contenu principal dans une carte -->
        <main class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <!-- La carte blanche qui contient le contenu de votre page -->
                <div class="bg-white shadow-md overflow-hidden rounded-lg">
                      @yield('content')
                     
                </div>
            </div>
        </main>
    </div>
</body>
</html>