<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('curriculum_modules')) {
            return;
        }

        Schema::create('curriculum_modules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('lang', 2); // en|de
            $table->string('title', 255);
            $table->string('level', 32);
            $table->string('sub_level', 16)->nullable();
            $table->json('lessons')->nullable(); // array of Lesson objects
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Keep index name short for MySQL identifier limits
            $table->index(['lang', 'level', 'sub_level', 'is_active', 'updated_at'], 'curr_mod_lang_lvl_sub_act_upd_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('curriculum_modules');
    }
};

