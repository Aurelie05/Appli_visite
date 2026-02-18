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
        Schema::create('visiteurs_archives', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id'); // id d'origine
            $table->string('numero_badge');
            $table->string('nom');
            $table->string('prenom');
            $table->string('telephone');
            $table->string('numero_cni');
            $table->string('personne_a_rencontrer');
            $table->string('motif_visite');
            $table->string('site');
            $table->timestamp('heure_entree');
            $table->timestamp('heure_sortie')->nullable();
            $table->timestamp('archived_at'); // date d’archivage
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visiteurs_archives');
    }
};
