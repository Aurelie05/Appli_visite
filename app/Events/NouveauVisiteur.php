<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NouveauVisiteur implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $visiteur;

    public function __construct($visiteur)
    {
        $this->visiteur = $visiteur;
    }

    public function broadcastOn()
    {
        return new Channel('visiteurs');
    }

    public function broadcastAs()
    {
        return 'nouveau-visiteur';
    }

    // Optionnel : s'assurer des données envoyées
    public function broadcastWith()
    {
        return [
            'visiteur' => $this->visiteur,
        ];
    }
}
