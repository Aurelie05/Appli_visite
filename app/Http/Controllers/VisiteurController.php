<?php

namespace App\Http\Controllers;

use App\Events\NouveauVisiteur;
use App\Models\Visiteur;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class VisiteurController extends Controller
{
    public function scanCni(Request $request)
    {
        $image = $request->image;

        if (! $image) {
            return Inertia::render('Formulaire', [
                'nom' => '',
                'prenom' => '',
                'numero_cni' => '',
                'error_ocr' => 'Aucune image reçue',
            ]);
        }

        $imageData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $image));
        $tempPath = storage_path('app/tmp_cni.png');
        file_put_contents($tempPath, $imageData);

        try {
            $text = (new \thiagoalessio\TesseractOCR\TesseractOCR($tempPath))
                ->lang('fra')
                ->run();
        } catch (\Exception $e) {
            unlink($tempPath);

            return Inertia::render('Formulaire', [
                'nom' => '',
                'prenom' => '',
                'numero_cni' => '',
                'error_ocr' => 'Erreur OCR: '.$e->getMessage(),
            ]);
        }

        unlink($tempPath);

        // Extraction simple
        $nom = null;
        $prenom = null;
        $numero = null;

        if (preg_match('/Nom:? ?([A-Z ]+)/i', $text, $m)) {
            $nom = trim($m[1]);
        }
        if (preg_match('/Prenom[s]?:? ?([A-Z ]+)/i', $text, $m)) {
            $prenom = trim($m[1]);
        }
        if (preg_match('/[A-Z]{2}[0-9]{6,}/i', $text, $m)) {
            $numero = trim($m[0]);
        }

        return Inertia::render('Formulaire', [
            'nom' => $nom ?? '',
            'prenom' => $prenom ?? '',
            'numero_cni' => $numero ?? '',
            'error_ocr' => empty($nom.$prenom.$numero) ? 'CNI non détectée' : null,
        ]);

    }

    // Afficher le formulaire
    public function showForm(Request $request)
    {
        return Inertia::render('Formulaire', [
            // Retirer 'photo_cni' des données de session si elle était utilisée
            'numero_badge' => session('numero_badge'),
            'nom' => '',
            'prenom' => '',
            'numero_cni' => '',
            'telephone' => '',
            'personne_a_rencontrer' => '',
            'motif_visite' => '',
            'error_ocr' => null,
        ]);
    }

    // Enregistrer les infos du visiteur
    public function store(Request $request)
    {
        try {
            $request->validate([
                'nom' => 'required|string',
                'prenom' => 'required|string',
                'telephone' => ['required', 'digits:10'],
                'numero_cni' => 'required|string',
                // Retirer 'photo_cni' de la validation
                'personne_a_rencontrer' => 'required|string',
                'motif_visite' => 'required|string',
            ]);

            \Log::info('Début de la création du visiteur');

            $visiteur = Visiteur::create([
                'numero_badge' => 'BADGE-'.now()->format('Ymd').'-'.str_pad(Visiteur::count() + 1, 4, '0', STR_PAD_LEFT),
                // Retirer 'photo_cni'
                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'telephone' => $request->telephone,
                'numero_cni' => $request->numero_cni,
                'personne_a_rencontrer' => $request->personne_a_rencontrer,
                'motif_visite' => $request->motif_visite,
                'heure_entree' => now(),
                'heure_sortie' => null,
            ]);

            \Log::info('Visiteur créé avec ID: '.$visiteur->id);

            \Log::info('Émission de l\'événement NouveauVisiteur');
            event(new NouveauVisiteur($visiteur));
            \Log::info('Événement émis');

            return Inertia::render('Formulaire', [
                // Retirer 'photo_cni'
                'numero_badge' => $visiteur->numero_badge,
                'message_success' => 'Visiteur enregistré avec succès !',
            ]);

        } catch (\Exception $e) {
            \Log::error('Erreur lors de l\'enregistrement du visiteur: '.$e->getMessage());
            \Log::error($e->getTraceAsString());

            // Retourner une réponse d'erreur
            return response()->json(['error' => 'Erreur interne du serveur'], 500);
        }
    }

    public function index()
    {
        $today = Carbon::today();
        $startOfWeek = Carbon::now()->startOfWeek();
        $endOfWeek = Carbon::now()->endOfWeek();
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();

        // Calcul des périodes précédentes pour les tendances
        $yesterday = Carbon::yesterday();
        $lastWeekStart = Carbon::now()->subWeek()->startOfWeek();
        $lastWeekEnd = Carbon::now()->subWeek()->endOfWeek();
        $lastMonthStart = Carbon::now()->subMonth()->startOfMonth();
        $lastMonthEnd = Carbon::now()->subMonth()->endOfMonth();

        // Statistiques actuelles
        $dailyVisits = Visiteur::whereDate('heure_entree', $today)->count();
        $weeklyVisits = Visiteur::whereBetween('heure_entree', [$startOfWeek, $endOfWeek])->count();
        $monthlyVisits = Visiteur::whereBetween('heure_entree', [$startOfMonth, $endOfMonth])->count();

        // Statistiques de comparaison
        $yesterdayVisits = Visiteur::whereDate('heure_entree', $yesterday)->count();
        $lastWeekVisits = Visiteur::whereBetween('heure_entree', [$lastWeekStart, $lastWeekEnd])->count();
        $lastMonthVisits = Visiteur::whereBetween('heure_entree', [$lastMonthStart, $lastMonthEnd])->count();

        // Calcul des tendances
        $dailyTrend = $yesterdayVisits > 0 ? (($dailyVisits - $yesterdayVisits) / $yesterdayVisits) * 100 : ($dailyVisits > 0 ? 100 : 0);
        $weeklyTrend = $lastWeekVisits > 0 ? (($weeklyVisits - $lastWeekVisits) / $lastWeekVisits) * 100 : ($weeklyVisits > 0 ? 100 : 0);
        $monthlyTrend = $lastMonthVisits > 0 ? (($monthlyVisits - $lastMonthVisits) / $lastMonthVisits) * 100 : ($monthlyVisits > 0 ? 100 : 0);

        // Données pour le graphique hebdomadaire - Correction des jours en français
        $weeklyData = collect(range(0, 6))->map(function ($i) {
            $day = Carbon::now()->startOfWeek()->addDays($i);

            // Conversion des jours anglais vers français
            $daysFr = [
                'Mon' => 'Lun', 'Tue' => 'Mar', 'Wed' => 'Mer',
                'Thu' => 'Jeu', 'Fri' => 'Ven', 'Sat' => 'Sam', 'Sun' => 'Dim',
            ];

            $dayEn = $day->format('D');
            $dayFr = $daysFr[$dayEn] ?? $dayEn;

            return [
                'day' => $dayFr,
                'date' => $day->format('d/m'),
                'visits' => Visiteur::whereDate('heure_entree', $day->toDateString())->count(),
            ];
        });

        // 5 visiteurs récents
        $recentVisitors = Visiteur::orderBy('heure_entree', 'desc')
            ->take(5)
            ->get()
            ->map(function ($visiteur) {
                return [
                    'id' => $visiteur->id,
                    'nom' => $visiteur->nom,
                    'prenom' => $visiteur->prenom,
                    'personne_a_rencontrer' => $visiteur->personne_a_rencontrer,
                    'motif_visite' => $visiteur->motif_visite,
                    'heure_entree' => $visiteur->heure_entree, // <-- on envoie la date brute
                ];
            });

        return Inertia::render('Dashboard', [
            'auth' => [
                'user' => Auth::user(),
            ],
            'stats' => [
                'daily' => $dailyVisits,
                'weekly' => $weeklyVisits,
                'monthly' => $monthlyVisits,
                'dailyTrend' => round($dailyTrend, 1),
                'weeklyTrend' => round($weeklyTrend, 1),
                'monthlyTrend' => round($monthlyTrend, 1),
            ],
            'weeklyData' => $weeklyData,
            'recentVisitors' => $recentVisitors,
        ]);

    }

    // GET - Affiche la liste
    public function visiteursList()
    {
        $visiteurs = Visiteur::orderBy('heure_entree', 'desc')
            ->get()
            ->map(function ($v) {
                return [
                    'id' => $v->id,
                    'numero_badge' => $v->numero_badge,
                    'nom' => $v->nom,
                    'prenom' => $v->prenom,
                    'telephone' => $v->telephone,
                    'numero_cni' => $v->numero_cni,
                    'personne_a_rencontrer' => $v->personne_a_rencontrer,
                    'motif_visite' => $v->motif_visite,
                    'heure_entree' => $v->heure_entree, // date brute
                    'heure_sortie' => $v->heure_sortie, // date brute ou null
                ];
            });

        return Inertia::render('ListeVisiteur', [ // <-- le nom du composant TSX
            'visiteurs' => $visiteurs,
            'auth' => [
                'user' => Auth::user(), // pour Inertia PageProps
            ],
        ]);
    }

    // POST - Finaliser la sortie
    public function finaliserSortie($id)
    {
        $visiteur = Visiteur::findOrFail($id);
        $visiteur->heure_sortie = now();
        $visiteur->save();

        return redirect()->back()->with('success', 'Sortie finalisée !');
    }
}
