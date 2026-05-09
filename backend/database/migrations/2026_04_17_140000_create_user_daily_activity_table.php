<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_daily_activity', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('activity_on');
            $table->timestamps();

            $table->unique(['user_id', 'activity_on']);
            $table->index('activity_on');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_daily_activity');
    }
};
