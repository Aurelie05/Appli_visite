<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory; // ✅ bien importer
use Illuminate\Database\Eloquent\Model;

class ArchiveVisiteur extends Model
{
    use HasFactory; // ✅ utiliser le trait correct

    protected $table = 'visiteurs_archives';

    protected $fillable = [
        'original_id', 'numero_badge', 'nom', 'prenom', 'telephone',
        'numero_cni', 'personne_a_rencontrer', 'motif_visite',
        'site', 'heure_entree', 'heure_sortie', 'archived_at',
    ];
}
