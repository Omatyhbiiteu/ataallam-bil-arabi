<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('content_folders') && ! Schema::hasColumn('content_folders', 'user_id')) {
            Schema::table('content_folders', function (Blueprint $table) {
                $table->foreignId('user_id')->nullable()->after('lang')->constrained('users')->nullOnDelete();
                $table->index(['lang', 'user_id']);
            });
        }

        if (Schema::hasTable('content_cards') && ! Schema::hasColumn('content_cards', 'user_id')) {
            Schema::table('content_cards', function (Blueprint $table) {
                $table->foreignId('user_id')->nullable()->after('lang')->constrained('users')->nullOnDelete();
                $table->index(['lang', 'user_id']);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('content_cards') && Schema::hasColumn('content_cards', 'user_id')) {
            Schema::table('content_cards', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
                $table->dropColumn('user_id');
            });
        }
        if (Schema::hasTable('content_folders') && Schema::hasColumn('content_folders', 'user_id')) {
            Schema::table('content_folders', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
                $table->dropColumn('user_id');
            });
        }
    }
};
