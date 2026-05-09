<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('payment_sessions')) {
            return;
        }

        Schema::create('payment_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // جدول users الحالي في النظام يستخدم id عددية (unsignedBigInteger)
            // لذلك نطابق النوع مع بقية الجداول (مثل user_notifications).
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();

            $table->string('plan_id', 128);
            $table->decimal('original_amount', 10, 2);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('final_amount', 10, 2);

            $table->string('coupon_code', 64)->nullable();
            $table->string('payment_method', 64)->nullable(); // vodafone_cash|instapay|fawry
            $table->string('status', 32)->default('pending'); // pending|paid|expired|cancelled

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_sessions');
    }
};

