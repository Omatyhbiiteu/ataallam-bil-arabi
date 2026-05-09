<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('stories')) {
            return;
        }

        Schema::create('stories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('lang', 2); // en|de

            $table->string('title', 255);
            $table->text('description');
            $table->longText('content');
            $table->longText('translation')->nullable();
            $table->string('image', 2048)->nullable();

            $table->string('level', 8); // A1..C2 or Beginner/Intermediate...
            $table->string('sub_level', 16)->nullable(); // A1.1, A1.2, ...

            $table->json('questions')->nullable(); // array of Question
            $table->json('tags')->nullable();

            $table->unsignedInteger('word_count')->nullable();
            $table->unsignedInteger('estimated_reading_time')->nullable();
            $table->unsignedTinyInteger('difficulty')->nullable(); // 1..10
            $table->unsignedInteger('view_count')->nullable();

            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['lang', 'level', 'sub_level', 'is_active', 'updated_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stories');
    }
};

