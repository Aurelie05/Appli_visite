<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Agent extends Model
{
    protected $fillable = [
        'nom',
        'prenom',
        'site',
        'user_id', // 🔹 OBLIGATOIRE sinon Eloquent ignore ce champ
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
