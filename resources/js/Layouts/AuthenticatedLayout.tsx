import { Link, usePage, router } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState, useEffect } from 'react';
import logo from '@/Assets/logoINP.75e5c7a93c30dc493d7f.png';
import { User } from '@/types';


// Props partagées par Inertia
interface SharedProps {
    auth: {
        user: User;
        is_admin?: boolean;
        is_superviseur?: boolean;
        is_agent?: boolean;
    };
    notifications?: {
        visiteurs_en_attente: number;
    };
    [key: string]: any;
}

export default function Authenticated({ header, children }: PropsWithChildren<{ header?: ReactNode }>) {
    const { props } = usePage<SharedProps>();

    // Extraction sécurisée avec valeurs par défaut
    const auth = props.auth ?? { user: { name: '', email: '' }, is_admin: false, is_superviseur: false, is_agent: false };
    const user = auth.user ?? { name: '', email: '' };
    const isAdmin = auth.is_admin === true;
    const isSuperviseur = auth.is_superviseur === true;
    const canManage = isAdmin || isSuperviseur; // pour les fonctionnalités admin
    const isAgent = auth.is_agent === true;

    const notifications = props.notifications ?? { visiteurs_en_attente: 0 };
    const enAttente = notifications.visiteurs_en_attente ?? 0;

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // 🔍 DEBUG : affiche les valeurs réelles
    useEffect(() => {
        console.log('👤 isAdmin =', isAdmin, '| isSuperviseur =', isSuperviseur, '| isAgent =', isAgent);
        console.log('📦 auth =', auth);
    }, [isAdmin, isSuperviseur, isAgent, auth]);

    const handleLogout = () => {
        router.post(route('logout'));
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Overlay mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar - FORCÉE VISIBLE SUR DESKTOP */}
            <div className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-gradient-to-b from-blue-600 to-blue-800 shadow-lg flex flex-col
                transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}>
                {/* Logo INPHB */}
                <div className="p-6 border-b border-blue-500">
                    <Link href={route('welcome')} className="flex items-center space-x-3" onClick={closeSidebar}>
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
                            <img className="w-full h-full object-contain" src={logo} alt="Logo INPHB" />
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-lg block">INPHB</h1>
                            <p className="text-blue-200 text-xs">Système d'enregistrement des visiteurs</p>
                        </div>
                    </Link>
                </div>

                {/* Navigation sidebar */}
                <nav className="p-4 flex-1">
                    {/* Dashboard - admin ou superviseur */}
                    {canManage && (
                        <Link
                            href="/dashboard"
                            className="flex items-center space-x-3 w-full p-3 text-white hover:bg-blue-700 rounded-lg transition-colors mb-2"
                            onClick={closeSidebar}
                        >
                            <span className="text-lg">📊</span>
                            <span className="font-medium">Dashboard</span>
                        </Link>
                    )}

                    {/* File d'attente - avec badge de notification (accessible à tous) */}
                    <Link
                        href="/file-attente"
                        className="flex items-center space-x-3 w-full p-3 text-white hover:bg-blue-700 rounded-lg transition-colors mb-2 relative"
                        onClick={closeSidebar}
                    >
                        <span className="text-lg relative">
                            ⏳
                            {enAttente > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {enAttente > 9 ? '9+' : enAttente}
                                </span>
                            )}
                        </span>
                        <span className="font-medium">File d'attente</span>
                    </Link>

                    {/* Liste des visiteurs - admin ou superviseur */}
                    {canManage && (
                        <Link
                            href="/visiteurs/list"
                            className="flex items-center space-x-3 w-full p-3 text-white hover:bg-blue-700 rounded-lg transition-colors mb-2"
                            onClick={closeSidebar}
                        >
                            <span className="text-lg">👥</span>
                            <span className="font-medium">Liste des visiteurs</span>
                        </Link>
                    )}

                    {/* Création de compte agent - admin ou superviseur */}
                    {canManage && (
                        <Link
                            href="/admin/agents/create"
                            className="flex items-center space-x-3 w-full p-3 text-white hover:bg-blue-700 rounded-lg transition-colors mb-2"
                            onClick={closeSidebar}
                        >
                            <span className="text-lg">➕</span>
                            <span className="font-medium">Création de compte agent</span>
                        </Link>
                    )}
                </nav>

                {/* Section utilisateur en bas */}
                <div className="p-4 border-t border-blue-500">
                    <div className="bg-blue-700 rounded-lg p-4 space-y-3">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                                {user.name?.charAt(0).toUpperCase() ?? '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">{user.name ?? 'Utilisateur'}</p>
                                <p className="text-blue-200 text-xs truncate">{user.email ?? ''}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-blue-700"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="text-sm font-medium">Déconnexion</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header mobile */}
                <header className="lg:hidden bg-white shadow-sm border-b border-blue-100">
                    <div className="mx-auto px-4 py-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={toggleSidebar}
                                className="p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                                    />
                                </svg>
                            </button>
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-md">
                                    <img className="w-full h-full object-contain p-1" src={logo} alt="Logo INPHB" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold text-gray-900">INPHB</h1>
                                    <p className="text-xs text-gray-500">Visiteurs</p>
                                </div>
                            </div>
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {user.name?.charAt(0).toUpperCase() ?? 'U'}
                            </div>
                        </div>
                        {header && <div className="mt-4">{header}</div>}
                    </div>
                </header>

                {/* Header desktop */}
                {header && (
                    <header className="hidden lg:block bg-white shadow-sm border-b border-blue-100">
                        <div className="mx-auto px-4 py-4 sm:px-6 lg:px-8">{header}</div>
                    </header>
                )}

                <main className="flex-1 py-6">
                    <div className="mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
                </main>
            </div>
        </div>
    );
}