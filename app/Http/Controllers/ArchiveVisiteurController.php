<?php

namespace App\Http\Controllers;

use App\Models\Visiteurs_archives;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request; // Pour l'export PDF
use Inertia\Inertia; // ✅ Remplace "use PDF;"

class ArchiveVisiteurController extends Controller
{
    public function index(Request $request)
    {
        $site = $request->get('site', null);
        $week = $request->get('week', null);

        $query = Visiteurs_archives::query(); // ← utilise le nom correct du modèle

        if ($site) {
            $query->where('site', $site);
        }

        if ($week) {
            $query->whereRaw('WEEK(archived_at, 1) = ?', [$week]);
        }

        $visiteurs = $query->orderBy('archived_at', 'desc')->paginate(20)->withQueryString();

        $weeks = Visiteurs_archives::selectRaw('DISTINCT WEEK(archived_at,1) as week_number')
            ->orderBy('week_number', 'desc')
            ->pluck('week_number');

        return Inertia::render('ArchivesPage', [
            'visiteurs' => $visiteurs,
            'weeks' => $weeks,
            'selectedWeek' => $week,
            'selectedSite' => $site,
            'sites' => ['INPHB_SUD', 'INPHB_CENTRE', 'INPHB_NORD'],
        ]);
    }

    public function exportPdf(Request $request)
    {
        $site = $request->get('site', null);
        $week = $request->get('week', null);

        $query = Visiteurs_archives::query(); // ← nom correct

        if ($site) {
            $query->where('site', $site);
        }

        if ($week) {
            $query->whereRaw('WEEK(archived_at,1) = ?', [$week]);
        }

        $visiteurs = $query->orderBy('archived_at', 'desc')->get();

        $pdf = Pdf::loadView('pdf.archives', compact('visiteurs', 'week', 'site'));

        return $pdf->download('archives_visiteurs.pdf');

        // return $pdf->download('archives_visiteurs.pdf');
    }
}
