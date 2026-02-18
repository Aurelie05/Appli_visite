import React, { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import Authenticated from "@/Layouts/AuthenticatedLayout";

// Enregistrement des composants Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

// Interface des propriétés reçues du contrôleur
interface DashboardProps extends Record<string, unknown> {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
        };
    };
    stats: {
        daily: number;
        weekly: number;
        monthly: number;
        dailyTrend: number;
        weeklyTrend: number;
        monthlyTrend: number;
        dailyBySite: { site: string; count: number }[];
        weeklyBySite: { site: string; count: number }[];
        archivedCount: number;
        siteStats: { site: string; count: number }[];
    };
    weeklyData: any[];
    recentVisitors: (Visiteur & { site: string })[];
}

interface Visiteur {
    id: number;
    prenom: string;
    nom: string;
    personne_a_rencontrer: string;
    motif_visite: string;
    heure_entree: string;
}

export default function Dashboard() {
    const { stats, weeklyData, recentVisitors: initialVisitors } = usePage<DashboardProps>().props;
    const [recentVisitors, setRecentVisitors] = useState(initialVisitors);

    // Couleur de tendance
    const getTrendColor = (trend: number) => (trend >= 0 ? "text-emerald-600" : "text-rose-600");

    // Formatage
    const formatTime = (timeString: string) =>
        new Date(timeString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Données pour le diagramme circulaire
    const pieData = {
        labels: stats.siteStats?.map(item => item.site) || [],
        datasets: [
            {
                label: 'Visites',
                data: stats.siteStats?.map(item => item.count) || [],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' as const },
            tooltip: { enabled: true },
        },
    };

    // WebSocket
    useEffect(() => {
        if (!window.Echo) {
            console.error('Echo n\'est pas disponible');
            return;
        }
        const channel = window.Echo.channel("visiteurs");
        channel.listen("nouveau-visiteur", (e: any) => {
            setRecentVisitors((prev) => [e.visiteur, ...prev]);
        }).error((error: any) => console.error('Erreur Echo:', error));
        return () => window.Echo.leave("visiteurs");
    }, []);

    return (
        <Authenticated>
            <div className="p-6 max-w-7xl mx-auto">
                {/* En-tête */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
                    <p className="text-sm text-gray-600 mt-1">Aperçu des visites et statistiques par site</p>
                </div>

                {/* Statistiques globales (4 cartes) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Carte quotidienne */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl mr-4">
                            📊
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-600">Visites du jour</h3>
                            <p className="text-2xl font-bold text-gray-900">{stats.daily}</p>
                            <p className={`text-sm font-medium ${getTrendColor(stats.dailyTrend)}`}>
                                {stats.dailyTrend >= 0 ? '↗' : '↘'} {Math.abs(stats.dailyTrend)}%
                            </p>
                        </div>
                    </div>

                    {/* Carte hebdomadaire */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-2xl mr-4">
                            📈
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-600">Visites semaine</h3>
                            <p className="text-2xl font-bold text-gray-900">{stats.weekly}</p>
                            <p className={`text-sm font-medium ${getTrendColor(stats.weeklyTrend)}`}>
                                {stats.weeklyTrend >= 0 ? '↗' : '↘'} {Math.abs(stats.weeklyTrend)}%
                            </p>
                        </div>
                    </div>

                    {/* Carte mensuelle */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center">
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-2xl mr-4">
                            📅
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-600">Visites mois</h3>
                            <p className="text-2xl font-bold text-gray-900">{stats.monthly}</p>
                            <p className={`text-sm font-medium ${getTrendColor(stats.monthlyTrend)}`}>
                                {stats.monthlyTrend >= 0 ? '↗' : '↘'} {Math.abs(stats.monthlyTrend)}%
                            </p>
                        </div>
                    </div>

                    {/* Carte archives */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center">
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-2xl mr-4">
                            📦
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-600">Visites archivées</h3>
                            <p className="text-2xl font-bold text-gray-900">{stats.archivedCount}</p>
                            <p className="text-sm font-medium text-gray-500">📁 total</p>
                        </div>
                    </div>
                </div>

                {/* Visites du jour par site */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {stats.dailyBySite.map((siteData) => (
                        <div
                            key={siteData.site}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white"
                        >
                            <h4 className="text-lg font-semibold mb-2">{siteData.site}</h4>
                            <p className="text-3xl font-bold">{siteData.count} visite(s)</p>
                            <p className="text-sm opacity-90">aujourd'hui</p>
                        </div>
                    ))}
                </div>

                {/* Section principale : deux colonnes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Diagramme circulaire */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Répartition par site</h2>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                visites totales
                            </span>
                        </div>
                        <div className="h-80">
                            <Pie data={pieData} options={pieOptions} />
                        </div>
                    </div>

                    {/* Visiteurs récents */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Visiteurs Récents</h2>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                {recentVisitors.length} visiteurs
                            </span>
                        </div>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {recentVisitors.map((visiteur) => (
                                <div key={visiteur.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                        {visiteur.prenom.charAt(0)}{visiteur.nom.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900">
                                            {visiteur.prenom} {visiteur.nom}
                                        </p>
                                        <div className="flex flex-wrap gap-2 text-sm text-gray-600 mt-1">
                                            <span>👤 {visiteur.personne_a_rencontrer}</span>
                                            <span>🎯 {visiteur.motif_visite}</span>
                                            <span className="text-gray-500">📍 {visiteur.site}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            📅 {formatDate(visiteur.heure_entree)}
                                        </p>
                                    </div>
                                    <div className="text-sm font-medium text-gray-700">
                                        {formatTime(visiteur.heure_entree)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}