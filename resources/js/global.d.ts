import Echo from 'laravel-echo';

declare module 'laravel-echo' {
    interface EchoConfig {
        broadcaster: 'reverb' | 'pusher' | 'socket.io' | 'null';
        key: string;
        wsHost: string;
        wsPort: number;
        wssPort: number;
        forceTLS: boolean;
        enabledTransports: string[];
        [key: string]: any;
    }
}

declare global {
    interface Window {
        Echo: Echo;
    }
}