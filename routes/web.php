<?php

use App\Http\Controllers\AgentController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\VisiteurController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
})->middleware('auth')->name('welcome');

// Dashboard accessible aux admin et superviseur
Route::middleware(['auth', 'role:admin,superviseur'])
    ->get('/dashboard', [VisiteurController::class, 'index'])
    ->name('dashboard');

// Groupe pour les agents (admin et superviseur)
Route::middleware(['auth', 'role:admin,superviseur'])->group(function () {
    Route::get('/admin/agents', [AgentController::class, 'index']);
    Route::post('/admin/agents', [AgentController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

Route::get('/scanner', function () {
    return inertia('CameraScanner');
});

// Formulaire
Route::get('/formulaire', [VisiteurController::class, 'showForm'])->name('formulaire');
Route::post('/visiteurs', [VisiteurController::class, 'store']);
Route::post('/upload-photo', [VisiteurController::class, 'uploadPhoto']);

// Liste des visiteurs (admin et superviseur)
Route::middleware(['auth', 'role:admin,superviseur'])->get('/visiteurs/list', [VisiteurController::class, 'visiteursParSite'])->name('visiteurs.parSite');

// Finaliser sortie (accessible à tous les utilisateurs authentifiés, car utilisé par les agents)
Route::post('/visiteur/sortie/{id}', [VisiteurController::class, 'finaliserSortie'])->name('visiteur.sortie');

Route::post('/scan-cni', [VisiteurController::class, 'scanCni']);

// Gestion des agents (admin et superviseur)
Route::middleware(['auth', 'role:admin,superviseur'])->group(function () {
    Route::get('/admin/agents', [AgentController::class, 'index'])->name('agents.index');
    Route::post('/admin/agents', [AgentController::class, 'store'])->name('agents.store');
    Route::delete('/admin/agents/{id}', [AgentController::class, 'destroy'])->name('agents.destroy');
    Route::get('/admin/agents/create', [AgentController::class, 'create'])->name('agents.create');
});

// Par site (admin et superviseur) – Note : cette route est un doublon de '/visiteurs/list', à vérifier
Route::middleware(['auth', 'role:admin,superviseur'])->get('/par-site', [VisiteurController::class, 'visiteursParSite'])->name('visiteurs.parSite');

// File d'attente accessible à tous les utilisateurs authentifiés (agents, admins, superviseurs)
Route::middleware(['auth'])->get('/file-attente', [VisiteurController::class, 'fileAttente'])->name('file-attente');
