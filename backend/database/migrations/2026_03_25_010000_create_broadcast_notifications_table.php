<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('broadcast_notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type', 32)->default('info'); // info|warning|success|system
            $table->string('icon', 32)->default('bell'); // bell|star|trophy|gift|alert-circle
            $table->string('target_audience', 32)->default('all'); // all|active|inactive
            $table->string('title');
            $table->text('message');
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index('target_audience');
            $table->index('sent_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('broadcast_notifications');
    }
};

