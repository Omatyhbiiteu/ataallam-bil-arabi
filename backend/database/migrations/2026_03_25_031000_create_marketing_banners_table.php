<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('marketing_banners')) {
            return;
        }

        Schema::create('marketing_banners', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->text('description');
            $table->string('emoji', 16)->nullable();

            $table->string('cta_text', 255)->nullable();
            $table->string('cta_link', 2048)->nullable();

            $table->boolean('is_active')->default(true);
            $table->string('type', 32)->default('popup'); // popup|banner

            $table->string('related_coupon_code', 64)->nullable();

            $table->string('background_color', 32)->nullable();
            $table->string('text_color', 32)->nullable();

            $table->timestamps();

            $table->index(['is_active', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_banners');
    }
};

