<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('language_availability_settings')) {
            Schema::create('language_availability_settings', function (Blueprint $table) {
                $table->id();
                $table->boolean('en_enabled')->default(true);
                $table->boolean('de_enabled')->default(true);
                $table->timestamps();
            });
        }

        // Seed a single row (id=1) if empty
        if (Schema::hasTable('language_availability_settings') && DB::table('language_availability_settings')->count() === 0) {
            $now = now();
            DB::table('language_availability_settings')->insert([
                'en_enabled' => true,
                'de_enabled' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('language_availability_settings');
    }
};

