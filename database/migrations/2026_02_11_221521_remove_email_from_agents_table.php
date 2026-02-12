<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('agents', function (Blueprint $table) {
            if (Schema::hasColumn('agents', 'email')) {
                $table->dropColumn('email');
            }

            // Si tu as ajouté password dans agents, tu peux le supprimer aussi
            if (Schema::hasColumn('agents', 'password')) {
                $table->dropColumn('password');
            }
        });
    }

    public function down(): void
    {
        Schema::table('agents', function (Blueprint $table) {
            $table->string('email')->unique()->after('prenom');
            $table->string('password')->after('email');
        });
    }
};
