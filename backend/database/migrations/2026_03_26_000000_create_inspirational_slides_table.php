<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('inspirational_slides')) {
            return;
        }

        Schema::create('inspirational_slides', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->longText('text');
            $table->string('source', 255);
            $table->string('gradient', 255);
            $table->string('icon', 64);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->nullable();
            $table->timestamps();

            $table->index(['is_active', 'sort_order', 'updated_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspirational_slides');
    }
};

