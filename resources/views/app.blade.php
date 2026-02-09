<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#ffffff">


    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    <!-- Fonts -->
    <link rel="icon" type="image/png" href="/icons/icon-192x192.png">

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

    <!-- Scripts -->
    @routes
    @viteReactRefresh

    @if (app()->environment('local'))
        {{-- Forcer Vite à utiliser l'IP locale pour téléphone --}}
        @vite([
            'resources/js/app.tsx',
            "resources/js/Pages/{$page['component']}.tsx"
        ], 'http://192.168.130.197:5173') {{-- Remplace par ton IP locale --}}
    @else
    @vite(['resources/js/app.tsx'])

    @endif

    @inertiaHead
</head>
<body class="font-sans antialiased">
    @inertia
</body>
</html>
