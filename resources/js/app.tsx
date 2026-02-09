import '../css/app.css';
import './bootstrap';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import Echo from 'laravel-echo';

// Déclaration type pour window.Echo
declare global {
    interface Window {
        Echo: any;
    }
}

// Echo factice COMPLET avec toutes les méthodes nécessaires
const createDummyEcho = () => {
    const dummyChannel = {
        listen: () => dummyChannel,
        stopListening: () => dummyChannel,
        subscribed: () => dummyChannel,
        here: () => dummyChannel,
        joining: () => dummyChannel,
        leaving: () => dummyChannel,
        whisper: () => dummyChannel,
        notification: () => dummyChannel,
        error: () => dummyChannel,
    };

    return {
        connector: {
            socket: {
                on: () => { },
                off: () => { },
                connect: () => { },
                disconnect: () => { },
                id: null
            }
        },
        socketId: () => 'dummy-socket-id',
        listen: () => dummyChannel,
        channel: () => dummyChannel,
        private: () => dummyChannel,
        encryptedPrivate: () => dummyChannel,
        presence: () => dummyChannel,
        join: () => dummyChannel,
        leave: () => { },
        leaveChannel: () => { },
        disconnect: () => { },
        stopListening: (channel?: string, event?: string) => {
            console.log(`[Echo dummy] stopListening called for ${channel} - ${event}`);
        }
    };
};

// Initialisation conditionnelle d'Echo
const initializeEcho = async () => {
    // Vérifier si les variables d'environnement sont présentes
    if (!import.meta.env.VITE_REVERB_APP_KEY || !import.meta.env.VITE_REVERB_HOST) {
        console.warn('Variables Reverb manquantes, utilisation d\'Echo factice');
        window.Echo = createDummyEcho();
        return;
    }

    try {
        const { default: Echo } = await import('laravel-echo');

        // SOLUTION : Utiliser "as any" pour bypasser les vérifications TypeScript strictes
        const echoConfig = {
            broadcaster: 'reverb' as any, // Force le type
            key: import.meta.env.VITE_REVERB_APP_KEY,
            wsHost: import.meta.env.VITE_REVERB_HOST,
            wsPort: Number(import.meta.env.VITE_REVERB_PORT),
            wssPort: Number(import.meta.env.VITE_REVERB_PORT),
            forceTLS: import.meta.env.VITE_REVERB_USE_TLS === 'true',
            enabledTransports: ['ws', 'wss'] as any,
        };

        window.Echo = new Echo(echoConfig as any); // Cast en any pour éviter les erreurs TypeScript

        // Gestion des événements de connexion
        if (window.Echo.connector && window.Echo.connector.socket) {
            window.Echo.connector.socket.on('connect', () => {
                console.log('✅ Connecté à Reverb');
            });

            window.Echo.connector.socket.on('error', (error: any) => {
                console.error('❌ Erreur Reverb:', error);
            });
        }

        console.log('✅ Echo avec Reverb initialisé');

    } catch (error) {
        console.warn('❌ Erreur initialisation Echo, utilisation du mode factice:', error);
        window.Echo = createDummyEcho();
    }
};

// Initialiser Echo immédiatement
initializeEcho();

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: { color: '#4B5563' },
});