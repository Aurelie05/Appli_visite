<?php

namespace App\Http\Controllers;

use App\Events\NouveauVisiteur;
use App\Models\ArchiveVisiteur;
use App\Models\Visiteur; // si utilisé
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
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

        try {
            // === GESTION DU FORMAT BASE64 ===
            // Si l'image ne commence pas par "data:image/", on ajoute le préfixe
            $base64Image = (strpos($image, 'data:image/') === 0) ? $image : 'data:image/png;base64,'.$image;

            // === APPEL API OCR.space ===
            $response = Http::asForm()
                ->post('https://api.ocr.space/parse/image', [
                    'apikey' => env('OCR_SPACE_API_KEY', 'K81813002388957'),
                    'base64Image' => $base64Image,
                    'language' => 'fre',
                    'OCREngine' => '2',
                ]);

            $data = $response->json();

            // Vérifier les erreurs
            if (isset($data['IsErroredOnProcessing']) && $data['IsErroredOnProcessing']) {
                throw new \Exception('Erreur OCR.space: '.($data['ErrorMessage'][0] ?? 'Erreur inconnue'));
            }

            if (! isset($data['ParsedResults'][0]['ParsedText'])) {
                throw new \Exception('Aucun texte extrait');
            }

            $text = $data['ParsedResults'][0]['ParsedText'] ?? '';

            // === EXTRACTION SIMPLIFIÉE ===
            $nom = '';
            $prenom = '';
            $numero = '';

            // Chercher le numéro
            if (preg_match('/CI\d+/', strtoupper($text), $matches)) {
                $numero = $matches[0];
            }

            // Chercher nom et prénom par lignes
            $lines = array_map('trim', explode("\n", $text));
            foreach ($lines as $index => $line) {
                // Si ligne est "Nom" ou "NOM", prendre la ligne suivante
                if (preg_match('/^nom$/i', $line) && isset($lines[$index + 1])) {
                    $nom = trim($lines[$index + 1]);
                }

                // Si ligne contient "Prénom" ou variante, prendre la ligne suivante
                if (preg_match('/prénom\(s\)|prénormis\)/i', $line) && isset($lines[$index + 1])) {
                    $prenom = trim($lines[$index + 1]);
                }
            }

            // Fallback: extraction par pattern
            if (empty($nom) && preg_match('/Nom\s*:?\s*([A-Z\s]+)/i', $text, $matches)) {
                $nom = trim($matches[1]);
            }

            if (empty($prenom) && preg_match('/Prénom\(s\)\s*:?\s*([A-Z\s\-]+)/i', $text, $matches)) {
                $prenom = trim($matches[1]);
            }

            return Inertia::render('Formulaire', [
                'nom' => $nom,
                'prenom' => $prenom,
                'numero_cni' => $numero,
                'error_ocr' => empty($nom.$prenom.$numero) ? 'CNI non détectée' : null,
            ]);

        } catch (\Exception $e) {
            return Inertia::render('Formulaire', [
                'nom' => '',
                'prenom' => '',
                'numero_cni' => '',
                'error_ocr' => 'Erreur OCR: '.$e->getMessage(),
            ]);
        }
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
                'personne_a_rencontrer' => 'required|string',
                'motif_visite' => 'required|string',
            ]);

            \Log::info('Début de la création du visiteur');

            // 🔥 Récupérer l'agent connecté
            $agent = auth()->user()->agent;

            if (! $agent) {
                return response()->json([
                    'error' => 'Aucun agent associé à cet utilisateur.',
                ], 403);
            }

            $visiteur = Visiteur::create([
                'numero_badge' => 'BADGE-'.now()->format('Ymd').'-'.str_pad(Visiteur::count() + 1, 4, '0', STR_PAD_LEFT),

                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'telephone' => $request->telephone,
                'numero_cni' => $request->numero_cni,
                'personne_a_rencontrer' => $request->personne_a_rencontrer,
                'motif_visite' => $request->motif_visite,

                'heure_entree' => now(),
                'heure_sortie' => null,

                // ✅ LIAISON AGENT
                'agent_id' => $agent->id,
                'site' => $agent->site,
            ]);

            \Log::info('Visiteur créé avec ID: '.$visiteur->id);

            event(new NouveauVisiteur($visiteur));

            return Inertia::render('Formulaire', [
                'numero_badge' => $visiteur->numero_badge,
                'message_success' => 'Visiteur enregistré avec succès !',
            ]);

        } catch (\Exception $e) {

            \Log::error('Erreur lors de l\'enregistrement du visiteur: '.$e->getMessage());
            \Log::error($e->getTraceAsString());

            return response()->json([
                'error' => 'Erreur interne du serveur',
            ], 500);
        }
    }

    public function index()
    {
        $today = Carbon::today();
        $startOfWeek = Carbon::now()->startOfWeek();
        $endOfWeek = Carbon::now()->endOfWeek();
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();

        // Périodes précédentes pour les tendances
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

        // --- NOUVELLES DONNÉES ---

        // Visites par site aujourd'hui
        $dailyBySite = Visiteur::whereDate('heure_entree', $today)
            ->select('site', DB::raw('count(*) as count'))
            ->groupBy('site')
            ->get();

        // Visites par site cette semaine
        $weeklyBySite = Visiteur::whereBetween('heure_entree', [$startOfWeek, $endOfWeek])
            ->select('site', DB::raw('count(*) as count'))
            ->groupBy('site')
            ->get();

        // Nombre total d'archives (à adapter si votre modèle d'archive est différent)
        $archivedCount = ArchiveVisiteur::count(); // Assurez-vous que ce modèle existe

        // Statistiques pour le diagramme circulaire (ici : total des visites par site, toutes périodes)
        $siteStats = Visiteur::select('site', DB::raw('count(*) as count'))
            ->groupBy('site')
            ->get();

        // Données pour le graphique hebdomadaire
        $weeklyData = collect(range(0, 6))->map(function ($i) {
            $day = Carbon::now()->startOfWeek()->addDays($i);
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

        // 5 visiteurs récents avec le champ 'site' ajouté
        $recentVisitors = Visiteur::orderBy('heure_entree', 'desc')
            ->take(5)
            ->get(['id', 'nom', 'prenom', 'personne_a_rencontrer', 'motif_visite', 'heure_entree', 'site'])
            ->map(function ($visiteur) {
                return [
                    'id' => $visiteur->id,
                    'nom' => $visiteur->nom,
                    'prenom' => $visiteur->prenom,
                    'personne_a_rencontrer' => $visiteur->personne_a_rencontrer,
                    'motif_visite' => $visiteur->motif_visite,
                    'heure_entree' => $visiteur->heure_entree,
                    'site' => $visiteur->site, // ← AJOUTÉ
                ];
            });

        return Inertia::render('Dashboard', [
            'stats' => [
                'daily' => $dailyVisits,
                'weekly' => $weeklyVisits,
                'monthly' => $monthlyVisits,
                'dailyTrend' => round($dailyTrend, 1),
                'weeklyTrend' => round($weeklyTrend, 1),
                'monthlyTrend' => round($monthlyTrend, 1),
                // --- NOUVELLES STATS ---
                'dailyBySite' => $dailyBySite,
                'weeklyBySite' => $weeklyBySite,
                'archivedCount' => $archivedCount,
                'siteStats' => $siteStats,
            ],
            'weeklyData' => $weeklyData,
            'recentVisitors' => $recentVisitors,
        ]);
    }

    public function fileAttente()
    {
        $user = auth()->user();
        $agent = $user->agent;

        if ($agent) {
            // Agent : ses propres visiteurs présents
            $visiteurs = Visiteur::where('agent_id', $agent->id)
                ->whereNull('heure_sortie')
                ->orderBy('heure_entree', 'desc')
                ->get()
                ->toArray();
        } else {
            // Admin : tous les visiteurs présents
            $visiteurs = Visiteur::whereNull('heure_sortie')
                ->orderBy('heure_entree', 'desc')
                ->get()
                ->toArray();
        }

        return Inertia::render('FileAttente', [
            'visiteurs' => $visiteurs,
        ]);
    }

    public function visiteursParSite()
    {
        $visiteursSud = Visiteur::where('site', 'INPHB_SUD')->get()->toArray();
        $visiteursCentre = Visiteur::where('site', 'INPHB_CENTRE')->get()->toArray();
        $visiteursNord = Visiteur::where('site', 'INPHB_NORD')->get()->toArray();

        return Inertia::render('ListeVisiteur', [
            'sud' => $visiteursSud,
            'centre' => $visiteursCentre,
            'nord' => $visiteursNord,
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
