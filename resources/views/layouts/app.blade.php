<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>BEROCERT Admin Web - @yield('title', 'Vue établissement')</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
    
    <!-- Styles personnalisés -->
    <style>
        body { 
            font-family: 'Plus Jakarta Sans', sans-serif; 
            background: linear-gradient(180deg, #f4f8fc 0%, #eef4fb 100%); 
        }
        :root {
            --bero-green: #2A8734;
            --bero-blue: #1F65A7;
            --bero-dark: #13385E;
            --bero-soft: #eff6ff;
            --bero-border: #dbe7f3;
        }
        .glass-card {
            background: rgba(255,255,255,0.92);
            backdrop-filter: blur(14px);
            box-shadow: 0 14px 40px rgba(19,56,94,0.08);
        }
        .nav-item.active {
            background: linear-gradient(135deg, rgba(31,101,167,0.18), rgba(42,135,52,0.16));
            color: white;
            border-color: rgba(255,255,255,0.12);
        }
        .nav-item:hover { transform: translateX(2px); }
        .module-tile:hover, .kpi-card:hover, .mini-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 16px 30px rgba(19,56,94,0.10);
        }
        .icon-shell {
            background: linear-gradient(135deg, rgba(31,101,167,0.10) 0%, rgba(42,135,52,0.12) 100%);
        }
        .waste-dot { width: 10px; height: 10px; border-radius: 999px; display: inline-block; }
        .progress-bar { height: 8px; border-radius: 999px; background: #e8f0f8; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 999px; }
    </style>
    
    @stack('styles')
</head>
<body class="min-h-screen text-slate-800">
    <div class="min-h-screen flex">
        <!-- Sidebar -->
        @include('layouts.sidebar')
        
        <!-- Main content -->
        <main class="flex-1 overflow-auto">
            <!-- Header -->
            @include('layouts.header')
            
            <!-- Page content -->
            @yield('content')
        </main>
    </div>
    
    <!-- Scripts -->
    <script>
        function toggleModulesMenu() {
            const menu = document.getElementById('modules-menu');
            const chevron = document.getElementById('modules-chevron');
            menu.classList.toggle('hidden');
            chevron.classList.toggle('rotate-180');
        }
    </script>
    
    @stack('scripts')
</body>
</html>