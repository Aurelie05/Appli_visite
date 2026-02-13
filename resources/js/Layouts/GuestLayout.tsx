import React, { PropsWithChildren } from 'react';
import { Link, usePage } from '@inertiajs/react';
import logo from '@/Assets/logoINP.75e5c7a93c30dc493d7f.png';
import '@/Style/GuestLayout.css';

interface GuestProps extends PropsWithChildren {
    auth?: {
        user?: {
            name: string;
        };
    };
}

export default function Guest({ children }: GuestProps) {
    const { props } = usePage();
    const auth = props.auth as { user?: any; is_admin?: boolean; is_superviseur?: boolean; is_agent?: boolean };
    const notifications = props.notifications as { visiteurs_en_attente: number } | undefined;
    const enAttente = notifications?.visiteurs_en_attente || 0;
    const isAdmin = auth?.is_admin === true;
    const isSuperviseur = auth?.is_superviseur === true;
    const canManage = isAdmin || isSuperviseur; // pour les fonctionnalités admin

    return (
        <div className="guest-container">
            <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200">
                <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo et titre */}
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <Link href="/" className="flex items-center space-x-2 sm:space-x-4">
                                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg p-1 sm:p-2">
                                    <img
                                        className="w-full h-full object-contain"
                                        src={logo}
                                        alt="Logo INPHB"
                                    />
                                </div>
                                <div className="hidden sm:block">
                                    <h1 className="text-lg sm:text-xl font-bold text-gray-900">INPHB</h1>
                                    <p className="text-xs sm:text-sm text-gray-600">Système d'enregistrement des visiteurs</p>
                                </div>
                                <div className="sm:hidden">
                                    <h1 className="text-sm font-bold text-gray-900">INPHB</h1>
                                </div>
                            </Link>
                        </div>

                        {/* Partie droite */}
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            {auth?.user ? (
                                <>
                                    {/* Icône file d'attente pour tous les utilisateurs connectés */}
                                    <Link
                                        href={route('file-attente')}
                                        className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                        {enAttente > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                                {enAttente > 9 ? '9+' : enAttente}
                                            </span>
                                        )}
                                    </Link>

                                    {/* Dashboard visible pour les admins et superviseurs */}
                                    {canManage && (
                                        <Link
                                            href={route('dashboard')}
                                            className="bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-700 transition duration-150 text-sm sm:text-base"
                                        >
                                            Dashboard
                                        </Link>
                                    )}

                                </>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className="bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-700 transition duration-150 text-sm sm:text-base"
                                >
                                    Connexion
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
            <main className="guest-main">{children}</main>
        </div>
    );
}