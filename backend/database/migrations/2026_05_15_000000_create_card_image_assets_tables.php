<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('card_image_assets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('lang', 2);
            $table->string('ar_label');
            $table->string('target_word');
            $table->string('image_url', 2048);
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by_admin_id')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->timestamps();

            $table->index(['lang', 'is_active', 'updated_at']);
        });

        Schema::create('card_image_asset_terms', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('asset_id')->constrained('card_image_assets')->cascadeOnDelete();
            $table->string('lang', 2);
            $table->string('term');
            $table->string('term_normalized');
            $table->timestamps();

            $table->unique(['asset_id', 'lang', 'term_normalized'], 'card_image_asset_terms_unique');
            $table->index(['lang', 'term_normalized'], 'card_image_asset_terms_lookup');
        });

        Schema::create('user_feature_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('feature', 80);
            $table->unsignedInteger('count')->default(0);
            $table->timestamp('window_started_at')->nullable();
            $table->timestamp('exhausted_at')->nullable();
            $table->timestamp('resets_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'feature'], 'user_feature_usages_unique');
            $table->index(['feature', 'resets_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_feature_usages');
        Schema::dropIfExists('card_image_asset_terms');
        Schema::dropIfExists('card_image_assets');
    }
};
