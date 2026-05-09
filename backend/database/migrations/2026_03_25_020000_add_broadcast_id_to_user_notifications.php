<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('user_notifications')) {
            return;
        }

        if (! Schema::hasColumn('user_notifications', 'broadcast_id')) {
            Schema::table('user_notifications', function (Blueprint $table) {
                $table->uuid('broadcast_id')->nullable()->after('ticket_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('user_notifications') && Schema::hasColumn('user_notifications', 'broadcast_id')) {
            Schema::table('user_notifications', function (Blueprint $table) {
                $table->dropColumn('broadcast_id');
            });
        }
    }
};

