<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('marketing_coupons')) {
            return;
        }

        Schema::create('marketing_coupons', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 64)->unique();
            $table->unsignedSmallInteger('discount_percentage');
            $table->boolean('is_active')->default(true);
            $table->timestamp('expiry_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_coupons');
    }
};

