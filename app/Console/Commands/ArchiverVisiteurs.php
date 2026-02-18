<?php

namespace App\Console\Commands;

use App\Models\Visiteur;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

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
    protected $description = 'Archive les visiteurs sortis depuis plus de 7 jours';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Début archivage...');

        DB::transaction(function () {

            $anciensVisiteurs = Visiteur::whereNotNull('heure_sortie')
                ->where('heure_sortie', '<', now()->subWeek())
                ->get();

            foreach ($anciensVisiteurs as $visiteur) {

                // Insert dans la table visiteurs_archives
                DB::table('visiteurs_archives')->insert([
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

                $visiteur->delete();
            }

            $this->info(count($anciensVisiteurs).' visiteurs archivés.');
            \Log::info('Tâche visiteurs:archiver exécutée à '.now().' | Nombre : '.count($anciensVisiteurs));
        });

        $this->info('Archivage terminé avec succès.');
    }
}
