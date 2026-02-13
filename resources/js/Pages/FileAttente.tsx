import React from 'react';
import { usePage, router } from '@inertiajs/react';
import { PageProps } from '@/types';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'; // ou GuestLayout selon votre choix

interface Visiteur {
    id: number;
    numero_badge: string;
    nom: string;
    prenom: string;
    telephone: string;
    numero_cni: string;
    personne_a_rencontrer: string;
    motif_visite: string;
    heure_entree: string;
    heure_sortie: string | null;
}

interface Props extends PageProps {
    visiteurs?: Visiteur[];
}


export default function FileAttente() {
    const { visiteurs = [] } = usePage<Props>().props;


    const handleSortie = (id: number) => {
        if (confirm('Confirmer la sortie de ce visiteur ?')) {
            router.post(`/visiteur/sortie/${id}`, {}, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ only: ['notifications'] }); // recharge uniquement la clé 'notifications'
                }
            });
        }
    };

    const formatHeure = (time?: string | null) => {
        if (!time) return '-';
        const date = new Date(time);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <AuthenticatedLayout>
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">File d'attente</h1>
                    <p className="text-gray-600 mb-4">
                        Visiteurs actuellement présents ({visiteurs.length})
                    </p>

                    {visiteurs.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                            <p className="text-gray-500">Aucun visiteur en attente.</p>
                        </div>
                    ) : (
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                            <ul className="divide-y divide-gray-200">
                                {visiteurs.map((v) => (
                                    <li key={v.id} className="p-4 hover:bg-gray-50">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                                        {v.numero_badge}
                                                    </span>
                                                    <span className="font-medium text-gray-900">{v.nom} {v.prenom}</span>
                                                </div>
                                                <div className="text-sm text-gray-600 space-y-1">
                                                    <p>Tél: {v.telephone}</p>
                                                    <p>Rendez-vous avec: {v.personne_a_rencontrer}</p>
                                                    <p>Motif: {v.motif_visite}</p>
                                                    <p>Entrée: {formatHeure(v.heure_entree)}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleSortie(v.id)}
                                                className="mt-3 sm:mt-0 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                                            >
                                                Marquer la sortie
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}