<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('story_question_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('story_id');
            $table->string('question_id', 128);
            $table->boolean('correct');
            $table->timestamps();

            $table->index(['story_id', 'question_id']);
            $table->index('created_at');

            $table->foreign('story_id')
                ->references('id')
                ->on('stories')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('story_question_attempts');
    }
};
