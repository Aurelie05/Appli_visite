<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AgentController extends Controller
{
    // 🔹 Afficher la liste des agents
    public function index()
    {
        $agents = Agent::with('user')->latest()->get();

        return Inertia::render('Admin/Agents/Index', [
            'agents' => $agents,
        ]);
    }

    public function create()
    {
        return Inertia::render('creation_agent');
    }

    // 🔹 Enregistrer un nouvel agent
    public function store(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'site' => 'required|in:INPHB_SUD,INPHB_CENTRE,INPHB_NORD',
            'password' => 'required|min:6',
        ]);

        // 1️⃣ Créer le user (login)
        $user = User::create([
            'name' => $request->nom.' '.$request->prenom,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'agent', // si tu utilises un système de rôle
        ]);

        // 2️⃣ Créer l'agent lié au user
        Agent::create([
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'site' => $request->site,
            'user_id' => $user->id,
        ]);

        return redirect()->back()->with('success', 'Agent créé avec succès.');
    }

    // 🔹 Supprimer un agent
    public function destroy($id)
    {
        $agent = Agent::findOrFail($id);

        // Supprime aussi le user lié
        $agent->user()->delete();

        return redirect()->back()->with('success', 'Agent supprimé.');
    }
}
