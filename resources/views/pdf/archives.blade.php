<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Archives visiteurs</title>
    <style>
        /* Marges de la page */
        @page {
            margin: 2cm 1.5cm;
        }

        body {
            font-family: 'Helvetica', 'Arial', 'DejaVu Sans', sans-serif;
            font-size: 9pt;
            line-height: 1.4;
            color: #2c3e50;
        }

        /* En-tête */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .header h1 {
            font-size: 18pt;
            font-weight: 300;
            color: #2c3e50;
            margin: 0;
            letter-spacing: 1px;
        }
        .header h1 span {
            font-weight: 600;
            color: #3498db;
        }
        .header .date {
            font-size: 8pt;
            color: #7f8c8d;
        }

        /* Filtres appliqués */
        .filters {
            background-color: #ecf0f1;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 8pt;
            display: inline-block;
            margin-bottom: 15px;
        }
        .filters strong {
            color: #2980b9;
        }

        /* Tableau : largeurs fixes pour un rendu propre */
        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 8.5pt;
            margin-top: 10px;
        }

        th {
            background-color: #3498db;
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 8px 4px;
            border: 1px solid #2980b9;
        }

        td {
            padding: 6px 4px;
            border: 1px solid #bdc3c7;
            vertical-align: top;
            word-wrap: break-word;
        }

        /* Lignes alternées */
        tbody tr:nth-child(even) {
            background-color: #f9f9f9;
        }

        /* Largeurs des colonnes (ajustées pour tout faire tenir) */
        .col-badge { width: 7%; }
        .col-visiteur { width: 12%; }
        .col-telephone { width: 8%; }
        .col-personne { width: 12%; }
        .col-motif { width: 15%; }
        .col-entree { width: 9%; }
        .col-sortie { width: 9%; }
        .col-archive { width: 10%; }
        .col-site { width: 6%; }

        /* Pour les longs motifs */
        .cell-content {
            overflow-wrap: break-word;
            word-wrap: break-word;
        }

        /* Pied de page */
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 7pt;
            color: #95a5a6;
            border-top: 1px dashed #bdc3c7;
            padding-top: 5px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Archives <span>visiteurs</span></h1>
        <div class="date">
            {{ \Carbon\Carbon::now()->locale('fr_FR')->translatedFormat('l d F Y H:i') }}
        </div>
    </div>

    @if($week || $site)
    <div class="filters">
        <strong>Filtres :</strong>
        @if($week) Semaine {{ $week }} @endif
        @if($site) · Site {{ $site }} @endif
    </div>
    @else
    <div class="filters">
        <strong>Tous les visiteurs archivés</strong>
    </div>
    @endif

    <table>
        <thead>
            <tr>
                <th class="col-badge">Badge</th>
                <th class="col-visiteur">Visiteur</th>
                <th class="col-telephone">Téléphone</th>
                <th class="col-personne">Personne rencontrée</th>
                <th class="col-motif">Motif</th>
                <th class="col-entree">Entrée</th>
                <th class="col-sortie">Sortie</th>
                <th class="col-archive">Archivé le</th>
                <th class="col-site">Site</th>
            </tr>
        </thead>
        <tbody>
            @forelse($visiteurs as $v)
            <tr>
                <td class="col-badge">{{ $v->numero_badge }}</td>
                <td class="col-visiteur">{{ $v->nom }} {{ $v->prenom }}</td>
                <td class="col-telephone">{{ $v->telephone }}</td>
                <td class="col-personne">{{ $v->personne_a_rencontrer }}</td>
                <td class="col-motif cell-content">{{ $v->motif_visite }}</td>
                <td class="col-entree">{{ \Carbon\Carbon::parse($v->heure_entree)->format('d/m/Y H:i') }}</td>
                <td class="col-sortie">{{ \Carbon\Carbon::parse($v->heure_sortie)->format('d/m/Y H:i') }}</td>
                <td class="col-archive">{{ \Carbon\Carbon::parse($v->archived_at)->format('d/m/Y H:i') }}</td>
                <td class="col-site">{{ $v->site }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="9" style="text-align: center; padding: 20px; color: #7f8c8d;">
                    Aucune archive ne correspond aux critères.
                </td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Document généré par {{ config('app.name') }} · {{ \Carbon\Carbon::now()->format('d/m/Y H:i:s') }}
    </div>
</body>
</html>