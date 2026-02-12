<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('visiteurs', function (Blueprint $table) {
            $table->foreignId('agent_id')
                ->nullable() // important si tu as déjà des données
                ->constrained()
                ->cascadeOnDelete();

            $table->string('site')->nullable();
        });
    }

    public function down()
    {
        Schema::table('visiteurs', function (Blueprint $table) {
            $table->dropForeign(['agent_id']);
            $table->dropColumn(['agent_id', 'site']);
        });
    }
};
