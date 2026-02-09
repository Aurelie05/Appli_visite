<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('visiteurs', function (Blueprint $table) {
            $table->id();

            // Numéro généré automatiquement : BADGE-YYYYMMDD-0001
            $table->string('numero_badge')->unique();

            // Infos du visiteur (SUPPRIMER photo_cni)
            $table->string('nom');
            $table->string('prenom');
            $table->string('numero_cni');
            $table->string('telephone');

            // Infos de la visite
            $table->string('personne_a_rencontrer');
            $table->string('motif_visite');

            // Horaires
            $table->timestamp('heure_entree')->nullable();
            $table->timestamp('heure_sortie')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visiteurs');
    }
};
