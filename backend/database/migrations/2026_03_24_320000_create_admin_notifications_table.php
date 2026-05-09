<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('admin_notifications')) {
            return;
        }

        Schema::create('admin_notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('admin_user_id')->constrained('admin_users')->cascadeOnDelete();
            $table->string('kind', 64)->default('support_user_message');
            $table->string('title');
            $table->text('body');
            $table->uuid('ticket_id')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['admin_user_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_notifications');
    }
};
