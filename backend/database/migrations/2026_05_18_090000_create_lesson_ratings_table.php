<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('lang', 2)->index();
            $table->uuid('module_id')->nullable()->index();
            $table->string('module_title')->nullable();
            $table->string('lesson_id')->index();
            $table->string('lesson_title');
            $table->unsignedTinyInteger('rating');
            $table->timestamps();

            $table->unique(['user_id', 'lang', 'lesson_id'], 'lesson_ratings_user_lang_lesson_unique');
            $table->index(['lang', 'lesson_id'], 'lesson_ratings_lang_lesson_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_ratings');
    }
};
