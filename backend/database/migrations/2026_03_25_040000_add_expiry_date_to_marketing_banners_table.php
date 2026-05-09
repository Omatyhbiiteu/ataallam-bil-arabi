<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('marketing_banners')) {
            return;
        }

        if (Schema::hasColumn('marketing_banners', 'expiry_date')) {
            return;
        }

        Schema::table('marketing_banners', function (Blueprint $table) {
            $table->timestamp('expiry_date')->nullable()->after('is_active');
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('marketing_banners')) {
            return;
        }

        Schema::table('marketing_banners', function (Blueprint $table) {
            if (Schema::hasColumn('marketing_banners', 'expiry_date')) {
                $table->dropColumn('expiry_date');
            }
        });
    }
};

