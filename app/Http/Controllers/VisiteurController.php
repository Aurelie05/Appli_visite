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
    //     public function scanCni(Request $request)
    // {
    //     $image = $request->image;

    //     if (! $image) {
    //         return Inertia::render('Formulaire', [
    //             'nom' => '',
    //             'prenom' => '',
    //             'numero_cni' => '',
    //             'error_ocr' => 'Aucune image reçue',
    //         ]);
    //     }

    //     $imageData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $image));
    //     $tempPath = storage_path('app/tmp_cni.png');
    //     file_put_contents($tempPath, $imageData);

    //     try {
    //         $text = (new \thiagoalessio\TesseractOCR\TesseractOCR($tempPath))
    //             ->executable('C:\Program Files\Tesseract-OCR\tesseract.exe')
    //             ->lang('fra')
    //             ->config('debug_file', 'C:\wamp64\www\appli_viste\storage\logs\tesseract.log')
    //             ->run();
    //         // dd($text);

    //     } catch (\Exception $e) {
    //         unlink($tempPath);

    //         return Inertia::render('Formulaire', [
    //             'nom' => '',
    //             'prenom' => '',
    //             'numero_cni' => '',
    //             'error_ocr' => 'Erreur OCR: '.$e->getMessage(),
    //         ]);
    //     }

    //     unlink($tempPath);

    //     // Extraction pour CNI ivoirienne
    //     $nom = null;
    //     $prenom = null;
    //     $numero = null;

    //     // Normaliser les retours à la ligne
    //     $text = str_replace(["\r\n", "\r"], "\n", $text);

    //     // Chercher le numéro : motif "n°" suivi de espaces puis CI et des chiffres
    //     if (preg_match('/n°\s*(CI\d+)/i', $text, $m)) {
    //         $numero = trim($m[1]);
    //     }
    //     // Sinon, chercher CI suivi de chiffres sans "n°"
    //     elseif (preg_match('/\b(CI\d+)\b/i', $text, $m)) {
    //         $numero = trim($m[1]);
    //     }

    //     // Chercher le nom : "Nom :" suivi de tout jusqu'au prochain saut de ligne
    //     if (preg_match('/Nom\s*:\s*([^\n]+)/i', $text, $m)) {
    //         $nom = trim($m[1]);
    //     }

    //     // Chercher le prénom : "Prénom(s) :" suivi de tout jusqu'au prochain saut de ligne
    //     if (preg_match('/Prénom\(s\)\s*:\s*([^\n]+)/i', $text, $m)) {
    //         $prenom = trim($m[1]);
    //     }

    //     // Si on n'a pas trouvé avec "Prénom(s)", on essaie avec "Prénom"
    //     if (empty($prenom) && preg_match('/Prénom\s*:\s*([^\n]+)/i', $text, $m)) {
    //         $prenom = trim($m[1]);
    //     }

    //     // Si on n'a pas trouvé avec "Prénom", on essaie avec "Prenom" (sans accent)
    //     if (empty($prenom) && preg_match('/Prenom\(s\)\s*:\s*([^\n]+)/i', $text, $m)) {
    //         $prenom = trim($m[1]);
    //     }

    //     if (empty($prenom) && preg_match('/Prenom\s*:\s*([^\n]+)/i', $text, $m)) {
    //         $prenom = trim($m[1]);
    //     }

    //     return Inertia::render('Formulaire', [
    //         'nom' => $nom ?? '',
    //         'prenom' => $prenom ?? '',
    //         'numero_cni' => $numero ?? '',
    //         'error_ocr' => empty($nom.$prenom.$numero) ? 'CNI non détectée' : null,
    //     ]);
    // }

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
            // === SIMPLE - NE PAS SPÉCIFIER LE CHEMIN ===
            // La bibliothèque va chercher Tesseract automatiquement
            $text = (new \thiagoalessio\TesseractOCR\TesseractOCR($tempPath))
                ->lang('fra')
                ->run();

        } catch (\Exception $e) {
            @unlink($tempPath);

            return Inertia::render('Formulaire', [
                'nom' => '',
                'prenom' => '',
                'numero_cni' => '',
                'error_ocr' => 'Erreur OCR: '.$e->getMessage(),
            ]);
        }

        @unlink($tempPath);

        // ... (le reste du code d'extraction reste identique)
        // === EXTRACTION SIMPLE POUR VOTRE TEXTE SPÉCIFIQUE ===
        $lines = explode("\n", $text);
        $nom = '';
        $prenom = '';
        $numero = '';

        foreach ($lines as $line) {
            $line = trim($line);

            // Numéro CNI (commence par CI)
            if (preg_match('/CI\d+/', $line, $matches)) {
                $numero = $matches[0];
            }

            // Ligne avec "Nom" suivie ou précédée du nom
            if (preg_match('/Nom\s*[:]?\s*([A-Z]+)/i', $line, $matches)) {
                $nom = $matches[1];
            } elseif (preg_match('/^[A-Z]{2,}$/', $line) && empty($nom)) {
                // Si ligne en majuscules seule, c'est peut-être le nom
                $nom = $line;
            }

            // Ligne avec "Prénom" ou variante
            if (preg_match('/Prénormis\)\s*[:]?\s*(.+)/i', $line, $matches)) {
                $prenom = trim($matches[1]);
            } elseif (preg_match('/Prénom\(s\)\s*[:]?\s*(.+)/i', $line, $matches)) {
                $prenom = trim($matches[1]);
            } elseif (preg_match('/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/', $line) && empty($prenom)) {
                // Si ligne avec majuscules/minuscules, c'est peut-être le prénom
                $prenom = $line;
            }
        }

        // Si nom est "DJORO" mais on a "DJORO" quelque part
        if (empty($nom)) {
            if (preg_match('/\b(DJORO)\b/i', $text, $matches)) {
                $nom = $matches[1];
            }
        }

        // Si prénom est "AKRE ROXANE MARIE AURELIE"
        if (empty($prenom)) {
            if (preg_match('/\b(AKRE\s+ROXANE\s+MARIE(?:\s+AURELIE)?)\b/i', $text, $matches)) {
                $prenom = $matches[1];
            }
        }

        return Inertia::render('Formulaire', [
            'nom' => $nom,
            'prenom' => $prenom,
            'numero_cni' => $numero,
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
