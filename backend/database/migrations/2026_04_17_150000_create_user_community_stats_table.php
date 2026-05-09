<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_community_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('lang', 2);
            $table->unsignedInteger('stories_completed')->default(0);
            $table->unsignedInteger('quiz_total')->default(0);
            $table->unsignedTinyInteger('quiz_avg_percent')->default(0);
            $table->unsignedInteger('streak_days')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'lang']);
            $table->index('lang');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_community_stats');
    }
};
