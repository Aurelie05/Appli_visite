import React, { PropsWithChildren } from 'react';
import { Link } from '@inertiajs/react';
import logo from '@/Assets/logoINP.75e5c7a93c30dc493d7f.png';
import '@/Style/GuestLayout.css';

interface GuestProps extends PropsWithChildren {
    auth?: {
        user?: {
            name: string;
        };
    };
}

export default function Guest({ children, auth }: GuestProps) {
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

                        {/* Lien de connexion/inscription */}
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            {auth?.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-700 transition duration-150 text-sm sm:text-base"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="text-gray-700 hover:text-blue-600 transition duration-150 text-sm sm:text-base px-2 py-1 sm:px-0 sm:py-0"
                                    >
                                        Connexion
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-700 transition duration-150 text-sm sm:text-base"
                                    >
                                        Inscription
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Sous-titre pour mobile */}
                    <div className="sm:hidden mt-2 text-center">
                        <p className="text-xs text-gray-600">Système d'enregistrement des visiteurs</p>
                    </div>
                </div>
            </nav>

            <main className="guest-main">{children}</main>
        </div>
    );
}