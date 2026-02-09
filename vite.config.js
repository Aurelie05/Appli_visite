import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    server: {
        // Si tu veux rendre le serveur accessible seulement depuis ton PC (pas le téléphone),
        // utilise 'localhost' ou false. Si tu veux accessible depuis le réseau local, mettre true ou '0.0.0.0'.
        host: 'localhost', // -> Pas accessible depuis le réseau local
        port: 5173,
        strictPort: true,
        hmr: {
            host: 'localhost',
        },
    },

    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),

        // Vite PWA plugin — bien placé DANS le tableau plugins
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'Application Visiteur',
                short_name: 'Visiteur',
                theme_color: '#ffffff',
                background_color: '#ffffff',
                display: 'standalone',
                start_url: '/',
                icons: [
                    {
                        src: '/icons/icon-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/icons/icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,tsx,ts,jsx,svg,png,jpg,jpeg}'],
            },
        }),
    ],
});
