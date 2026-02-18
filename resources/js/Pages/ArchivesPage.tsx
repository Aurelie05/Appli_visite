import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    DocumentArrowDownIcon,
    CalendarIcon,
    BuildingOfficeIcon,
    UserIcon,
    PhoneIcon,
    IdentificationIcon,
    ClockIcon,
    ArchiveBoxIcon,
} from '@heroicons/react/24/outline';

interface Visiteur {
    id: number;
    numero_badge: string;
    nom: string;
    prenom: string;
    telephone: string;
    numero_cni: string;
    personne_a_rencontrer: string;
    motif_visite: string;
    site: string;
    heure_entree: string;
    heure_sortie: string;
    archived_at: string;
}

interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props extends PageProps {
    visiteurs: Paginated<Visiteur>;
    weeks: number[];
    selectedWeek?: number;
    selectedSite?: string;
    sites: string[];
}

export default function ArchivesPage({ visiteurs, weeks, selectedWeek, selectedSite, sites }: Props) {
    const [week, setWeek] = useState<number | ''>(selectedWeek || '');
    const [site, setSite] = useState<string>(selectedSite || '');

    const handleFilter = () => {
        const params = new URLSearchParams();
        if (week) params.append('week', String(week));
        if (site) params.append('site', site);
        // Reset to page 1 when filtering
        router.get(`/admin/archives?${params.toString()}`, {}, { preserveState: true, replace: true });
    };

    const handleExportPdf = () => {
        const params = new URLSearchParams();
        if (week) params.append('week', String(week));
        if (site) params.append('site', site);
        window.open(`/admin/archives/export-pdf?${params.toString()}`, '_blank');
    };

    const handlePageChange = (url: string | null) => {
        if (url) {
            router.get(url, {}, { preserveState: true, preserveScroll: true });
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const formatDateShort = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const hasActiveFilters = week !== '' || site !== '';

    return (
        <AuthenticatedLayout>
            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* En-tête */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <ArchiveBoxIcon className="h-8 w-8 text-indigo-600" />
                        Archives des visiteurs
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Consultez l'historique complet des passages archivés.
                    </p>
                </div>

                {/* Filtres */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="flex items-center gap-2 mb-4 text-gray-700">
                        <FunnelIcon className="h-5 w-5" />
                        <span className="font-medium">Filtrer les archives</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <select
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                value={week}
                                onChange={(e) => setWeek(e.target.value ? Number(e.target.value) : '')}
                            >
                                <option value="">Toutes les semaines</option>
                                {weeks.map((w) => (
                                    <option key={w} value={w}>Semaine {w}</option>
                                ))}
                            </select>
                        </div>

                        <div className="relative">
                            <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <select
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                value={site}
                                onChange={(e) => setSite(e.target.value)}
                            >
                                <option value="">Tous les sites</option>
                                {sites.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2 md:col-span-2">
                            <button
                                onClick={handleFilter}
                                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                                <MagnifyingGlassIcon className="h-5 w-5" />
                                Appliquer les filtres
                            </button>
                            <button
                                onClick={handleExportPdf}
                                className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                                <DocumentArrowDownIcon className="h-5 w-5" />
                                Exporter PDF
                            </button>
                        </div>
                    </div>
                    {hasActiveFilters && (
                        <div className="mt-4 text-sm text-gray-600">
                            Filtres actifs : {week && `Semaine ${week} `}{site && `· Site : ${site}`}
                        </div>
                    )}
                </div>

                {/* Liste des archives */}
                {visiteurs.data.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <ArchiveBoxIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">Aucune archive trouvée</p>
                        <p className="text-gray-400 text-sm mt-1">Essayez de modifier vos filtres</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {visiteurs.data.map((visiteur) => (
                                <div
                                    key={visiteur.id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
                                >
                                    {/* En-tête de carte */}
                                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                {visiteur.numero_badge}
                                            </span>
                                            <span className="font-semibold text-gray-900">
                                                {visiteur.nom} {visiteur.prenom}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            Archivé le {formatDateShort(visiteur.archived_at)}
                                        </span>
                                    </div>

                                    {/* Corps de carte */}
                                    <div className="px-6 py-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <PhoneIcon className="h-4 w-4 text-gray-400" />
                                                <span>{visiteur.telephone}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <IdentificationIcon className="h-4 w-4 text-gray-400" />
                                                <span>CNI: {visiteur.numero_cni}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                                                <span>{visiteur.site}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <UserIcon className="h-4 w-4 text-gray-400" />
                                                <span>Rencontre: {visiteur.personne_a_rencontrer}</span>
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-100 pt-3">
                                            <p className="text-sm text-gray-700">
                                                <span className="font-medium">Motif :</span> {visiteur.motif_visite}
                                            </p>
                                        </div>

                                        <div className="flex justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
                                            <div className="flex items-center gap-1">
                                                <ClockIcon className="h-3 w-3" />
                                                <span>Entrée: {formatTime(visiteur.heure_entree)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <ClockIcon className="h-3 w-3" />
                                                <span>Sortie: {formatTime(visiteur.heure_sortie)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {visiteurs.last_page > 1 && (
                            <div className="mt-8 flex justify-center">
                                <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    {visiteurs.links.map((link, index) => {
                                        if (link.url === null) {
                                            return (
                                                <span
                                                    key={index}
                                                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-400 bg-white border border-gray-300 cursor-not-allowed"
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            );
                                        }

                                        return (
                                            <button
                                                key={index}
                                                onClick={() => handlePageChange(link.url)}
                                                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border ${link.active
                                                    ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                                    }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    })}
                                </nav>
                            </div>
                        )}

                        <p className="text-sm text-gray-500 text-center mt-4">
                            Affichage de {visiteurs.data.length} sur {visiteurs.total} résultats
                        </p>
                    </>
                )}
            </div>
        </AuthenticatedLayout>
    );
}