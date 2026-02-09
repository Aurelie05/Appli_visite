import React, { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
import "@/Style/Dash.css";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import '@/Style/Dash.css'

interface DashboardProps {
    [key: string]: unknown;
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
    };
    weeklyData: any[];
    recentVisitors: any[];
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
    const [recentVisitors, setRecentVisitors] = useState<Visiteur[]>(initialVisitors);

    // Fonction pour déterminer la couleur de la tendance
    const getTrendColor = (trend: number) => {
        return trend >= 0 ? "#10b981" : "#ef4444";
    };

    // Fonction pour formater l'heure
    const formatTime = (timeString: string) => {
        const date = new Date(timeString);
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Fonction pour formater la date complète
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    // Fonction pour formater la date et l'heure complètes
    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    useEffect(() => {
        console.log('Initialisation de la connexion WebSocket...');

        // Vérifiez si Echo est disponible
        if (!window.Echo) {
            console.error('Echo n\'est pas disponible - vérifiez les variables d\'environnement');
            return;
        }

        console.log('Abonnement au canal "visiteurs"');

        // S'abonner au canal
        const channel = window.Echo.channel("visiteurs");

        channel.listen("nouveau-visiteur", (e: any) => {
            console.log('Événement reçu:', e);
            // Ajouter le nouveau visiteur en haut de la liste
            setRecentVisitors((prev) => [e.visiteur, ...prev]);
        })
            .error((error: any) => {
                console.error('Erreur avec le canal:', error);
            });

        // Nettoyage : quitter le channel quand le composant est démonté
        return () => {
            console.log('Nettoyage: quitter le canal "visiteurs"');
            window.Echo.leave("visiteurs");
        };
    }, []);

    return (
        <Authenticated>
            <div className="dashboard-container">
                {/* Header */}
                <div className="dashboard-header">
                    <h1 className="dashboard-title">Tableau de Bord</h1>
                    <p className="dashboard-subtitle">Aperçu des visites et statistiques</p>
                </div>

                {/* Section Statistiques */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon daily">
                            <span>📊</span>
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-title">Visites du jour</h3>
                            <p className="stat-number">{stats.daily}</p>
                            <div className="stat-trend" style={{ color: getTrendColor(stats.dailyTrend) }}>
                                {stats.dailyTrend >= 0 ? '↗' : '↘'} {Math.abs(stats.dailyTrend)}%
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon weekly">
                            <span>📈</span>
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-title">Visites semaine</h3>
                            <p className="stat-number">{stats.weekly}</p>
                            <div className="stat-trend" style={{ color: getTrendColor(stats.weeklyTrend) }}>
                                {stats.weeklyTrend >= 0 ? '↗' : '↘'} {Math.abs(stats.weeklyTrend)}%
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon monthly">
                            <span>📅</span>
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-title">Visites mois</h3>
                            <p className="stat-number">{stats.monthly}</p>
                            <div className="stat-trend" style={{ color: getTrendColor(stats.monthlyTrend) }}>
                                {stats.monthlyTrend >= 0 ? '↗' : '↘'} {Math.abs(stats.monthlyTrend)}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section Principale : Graphique et Visiteurs Récents */}
                <div className="dashboard-content">
                    {/* Graphique Hebdomadaire */}
                    <div className="chart-section">
                        <div className="section-header">
                            <h2 className="section-title">Statistiques Hebdomadaires</h2>
                            <span className="section-badge">7 jours</span>
                        </div>
                        <div className="chart-container">
                            {weeklyData.map((day, index) => (
                                <div key={index} className="chart-bar-group">
                                    <div className="bar-container">
                                        <div
                                            className="chart-bar"
                                            style={{ height: `${Math.max(day.visits * 8, 30)}px` }}
                                            title={`${day.visits} visites`}
                                        >
                                            <span className="bar-value">{day.visits}</span>
                                        </div>
                                    </div>
                                    <div className="bar-label">
                                        <span className="day-name">{day.day}</span>
                                        <span className="day-date">{day.date}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Visiteurs Récents */}
                    <div className="recent-section">
                        <div className="section-header">
                            <h2 className="section-title">Visiteurs Récents</h2>
                            <span className="section-badge">{recentVisitors.length} visiteurs</span>
                        </div>
                        <div className="visitors-list">
                            {recentVisitors.map((visiteur) => (
                                <div key={visiteur.id} className="visitor-card">
                                    <div className="visitor-avatar">
                                        {visiteur.prenom.charAt(0)}{visiteur.nom.charAt(0)}
                                    </div>
                                    <div className="visitor-info">
                                        <div className="visitor-name">
                                            {visiteur.prenom} {visiteur.nom}
                                        </div>
                                        <div className="visitor-details">
                                            <span className="visitor-contact">
                                                👤 {visiteur.personne_a_rencontrer}
                                            </span>
                                            <span className="visitor-motive">
                                                🎯 {visiteur.motif_visite}
                                            </span>
                                        </div>
                                        {/* AJOUT: Date de la visite */}
                                        <div className="visitor-date">
                                            📅 {formatDate(visiteur.heure_entree)}
                                        </div>
                                    </div>
                                    <div className="visitor-time">
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