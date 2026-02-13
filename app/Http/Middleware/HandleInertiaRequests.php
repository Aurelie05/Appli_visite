<?php

namespace App\Http\Middleware;

use App\Models\Visiteur;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    // public function share(Request $request): array
    // {
    //     $shared = parent::share($request);

    //     $user = $request->user();
    //     $agent = $user?->agent;

    //     $shared['auth'] = [
    //         'user' => $user,
    //         // admin = utilisateur connecté ET sans agent associé
    //         'is_admin' => $user && is_null($agent),
    //         // agent = utilisateur connecté ET avec agent associé
    //         'is_agent' => $user && ! is_null($agent),
    //     ];

    //     // Notifications : uniquement pour les agents
    //     $shared['notifications'] = [
    //         'visiteurs_en_attente' => $agent
    //             ? Visiteur::where('agent_id', $agent->id)
    //                 ->whereNull('heure_sortie')
    //                 ->count()
    //             : 0,
    //     ];

    //     return $shared;
    // }
    public function share(Request $request): array
    {
        $shared = parent::share($request);
        $user = $request->user();
        $agent = $user?->agent;

        $shared['auth'] = [
            'user' => $user,
            'is_admin' => $user && $user->role === 'admin',
            'is_superviseur' => $user && $user->role === 'superviseur',
            'is_agent' => $user && ! is_null($agent), // ou $user->role === 'agent'
        ];

        // Notifications pour agents
        $shared['notifications'] = [
            'visiteurs_en_attente' => $agent
                ? Visiteur::where('agent_id', $agent->id)->whereNull('heure_sortie')->count()
                : 0,
        ];

        return $shared;
    }
}
