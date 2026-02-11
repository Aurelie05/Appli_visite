<?php

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
})->name('welcome');
// Route::get('/', function () {
//     // Si l'utilisateur est connecté, on peut le rediriger vers le dashboard
//     if (Auth::check()) {
//         return redirect()->route('welcome.index');
//     }

//     // Sinon, redirige vers la page login
//     return redirect()->route('login');
// });

Route::middleware(['auth', 'role:admin,agent'])
    ->get('/dashboard', [VisiteurController::class, 'index'])
    ->name('dashboard');

Route::middleware(['auth', 'role:admin'])->group(function () {

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

// Liste des visiteurs (GET)
Route::get('/visiteurs/list', [VisiteurController::class, 'visiteursList'])->name('visiteurs.list');

// Finaliser sortie (POST)
Route::post('/visiteur/sortie/{id}', [VisiteurController::class, 'finaliserSortie'])->name('visiteur.sortie');

Route::post('/scan-cni', [VisiteurController::class, 'scanCni']);
