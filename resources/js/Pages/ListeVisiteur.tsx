import React from "react";
import { usePage } from "@inertiajs/react";
import { Inertia } from "@inertiajs/inertia";
import Authenticated from "@/Layouts/AuthenticatedLayout";

// Définir le type de l'utilisateur
interface User {
    id: number;
    name: string;
    email: string;
}

// Définir les props Inertia pour cette page
interface ListeVisiteurProps {
    auth: { user: User };
    visiteurs: {
        id: number;
        numero_badge: string;
        nom: string;
        prenom: string;
        telephone: string;
        numero_cni: string;
        personne_a_rencontrer: string;
        motif_visite: string;
        heure_entree: string;
        heure_sortie?: string | null;
    }[];
    [key: string]: any;
}

export default function ListeVisiteur() {
    const { auth, visiteurs } = usePage<ListeVisiteurProps>().props;

    const handleSortie = (id: number) => {
        if (confirm("Confirmer la sortie du visiteur ?")) {
            Inertia.post(`/visiteur/sortie/${id}`);
        }
    };

    const formatHeure = (time?: string | null) => {
        if (!time) return "-";
        const date = new Date(time);
        if (isNaN(date.getTime())) return "-";
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatutBadge = (heure_sortie: string | null | undefined) => {
        if (!heure_sortie) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Présent
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Sorti
            </span>
        );
    };

    return (
        <Authenticated>
            <div className="py-4 sm:py-6">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                    {/* En-tête de page */}
                    <div className="bg-white overflow-hidden shadow-xl sm:rounded-lg border border-blue-50">
                        <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-bold">Gestion des Visiteurs</h1>
                                    <p className="text-blue-100 mt-1 text-sm sm:text-base">
                                        Liste complète des visiteurs enregistrés
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-blue-100 text-sm sm:text-base">Connecté en tant que :</p>
                                    <p className="font-semibold text-sm sm:text-base">{auth.user.name}</p>
                                </div>
                            </div>
                        </div>

                        {/* Statistiques rapides */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 p-4 sm:p-6 bg-blue-50 border-b border-blue-100">
                            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-blue-100">
                                <div className="flex items-center">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs sm:text-sm font-medium text-gray-600">Total visiteurs</p>
                                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{visiteurs.length}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-blue-100">
                                <div className="flex items-center">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs sm:text-sm font-medium text-gray-600">Présents actuellement</p>
                                        <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                            {visiteurs.filter(v => !v.heure_sortie).length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-blue-100">
                                <div className="flex items-center">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs sm:text-sm font-medium text-gray-600">Sortis aujourd'hui</p>
                                        <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                            {visiteurs.filter(v => v.heure_sortie).length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tableau des visiteurs - Version Desktop */}
                        <div className="hidden lg:block p-4 sm:p-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Badge
                                            </th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Nom & Prénom
                                            </th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Contact
                                            </th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                CNI
                                            </th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Rendez-vous
                                            </th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Heures
                                            </th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Statut
                                            </th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {visiteurs.map((v) => (
                                            <tr key={v.id} className="hover:bg-blue-50 transition-colors duration-150">
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {v.numero_badge}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{v.nom}</div>
                                                    <div className="text-sm text-gray-500">{v.prenom}</div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {v.telephone}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {v.numero_cni}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="text-sm font-medium text-gray-900">{v.personne_a_rencontrer}</div>
                                                    <div className="text-sm text-gray-500">{v.motif_visite}</div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <div>Entrée: {formatHeure(v.heure_entree)}</div>
                                                    <div>Sortie: {formatHeure(v.heure_sortie)}</div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    {getStatutBadge(v.heure_sortie)}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                                    {!v.heure_sortie ? (
                                                        <button
                                                            onClick={() => handleSortie(v.id)}
                                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                                        >
                                                            Sortie
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-400">Terminé</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Version Mobile */}
                        <div className="lg:hidden p-4">
                            <div className="space-y-4">
                                {visiteurs.map((v) => (
                                    <div key={v.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center space-x-2">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    Badge: {v.numero_badge}
                                                </span>
                                                {getStatutBadge(v.heure_sortie)}
                                            </div>
                                            {!v.heure_sortie ? (
                                                <button
                                                    onClick={() => handleSortie(v.id)}
                                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200"
                                                >
                                                    Sortie
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 text-xs">Terminé</span>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <div>
                                                <h3 className="font-medium text-gray-900 text-sm">{v.nom} {v.prenom}</h3>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <span className="text-gray-600">Téléphone:</span>
                                                    <p className="font-medium">{v.telephone}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">CNI:</span>
                                                    <p className="font-medium">{v.numero_cni}</p>
                                                </div>
                                            </div>

                                            <div className="text-xs">
                                                <span className="text-gray-600">Rencontre:</span>
                                                <p className="font-medium">{v.personne_a_rencontrer}</p>
                                            </div>

                                            <div className="text-xs">
                                                <span className="text-gray-500">Motif:</span>
                                                <p className="font-medium">{v.motif_visite}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <span className="text-gray-500">Entrée:</span>
                                                    <p className="font-medium">{formatHeure(v.heure_entree)}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Sortie:</span>
                                                    <p className="font-medium">{formatHeure(v.heure_sortie)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {visiteurs.length === 0 && (
                            <div className="text-center py-8 sm:py-12">
                                <svg className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun visiteur</h3>
                                <p className="mt-1 text-sm text-gray-500">Aucun visiteur n'a été enregistré aujourd'hui.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}