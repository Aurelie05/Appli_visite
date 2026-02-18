<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory; // ✅ il manquait ça
use Illuminate\Database\Eloquent\Model;

class Visiteur extends Model
{
    use HasFactory; // ✅ ajoute ce trait

    protected $fillable = [
        'numero_badge',
        'nom',
        'prenom',
        'telephone',
        'numero_cni',
        'personne_a_rencontrer',
        'motif_visite',
        'heure_entree',
        'heure_sortie',
        'agent_id',
        'site',
    ];
}
