<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('game_attempts')) {
            return;
        }

        try {
            Schema::table('game_attempts', function (Blueprint $table) {
                $table->index(['user_id', 'started_at'], 'game_attempts_user_started_idx');
            });
        } catch (Throwable) {
            //
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('game_attempts')) {
            return;
        }

        try {
            Schema::table('game_attempts', function (Blueprint $table) {
                $table->dropIndex('game_attempts_user_started_idx');
            });
        } catch (Throwable) {
            //
        }
    }
};
