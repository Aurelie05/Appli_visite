<?php

namespace App\Console\Commands;

use App\Models\ArchiveVisiteur;
use App\Models\Visiteur;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ArchiverVisiteurs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'visiteurs:archiver';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Archive les visiteurs sortis depuis plus de 7 jours (ou plus ancien)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Début archivage...');

        // Ajuste la période pour tester facilement : subDay() = 1 jour, subWeek() = 7 jours
        $periode = now()->subWeek();
        // $periode = now()->subDay();

        $anciensVisiteurs = Visiteur::whereNotNull('heure_sortie')
            ->where('heure_sortie', '<', $periode)
            ->get();

        $this->info('Visiteurs trouvés : '.$anciensVisiteurs->count());
        Log::info('ArchiverVisiteurs - Visiteurs trouvés : '.$anciensVisiteurs->count());

        if ($anciensVisiteurs->isEmpty()) {
            $this->info('Aucun visiteur à archiver pour le moment.');

            return;
        }

        DB::transaction(function () use ($anciensVisiteurs) {

            foreach ($anciensVisiteurs as $visiteur) {
                // Crée l'entrée dans la table d'archives
                ArchiveVisiteur::create([
                    'original_id' => $visiteur->id,
                    'numero_badge' => $visiteur->numero_badge,
                    'nom' => $visiteur->nom,
                    'prenom' => $visiteur->prenom,
                    'telephone' => $visiteur->telephone,
                    'numero_cni' => $visiteur->numero_cni,
                    'personne_a_rencontrer' => $visiteur->personne_a_rencontrer,
                    'motif_visite' => $visiteur->motif_visite,
                    'site' => $visiteur->site,
                    'heure_entree' => $visiteur->heure_entree,
                    'heure_sortie' => $visiteur->heure_sortie,
                    'archived_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Supprime l'original
                $visiteur->delete();
            }

        });

        $this->info('Archivage terminé avec succès. Nombre de visiteurs archivés : '.$anciensVisiteurs->count());
        Log::info('ArchiverVisiteurs - Archivage terminé. Nombre : '.$anciensVisiteurs->count());
    }
}
