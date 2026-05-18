<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('content_cards') || Schema::hasColumn('content_cards', 'front_image_fit')) {
            return;
        }

        Schema::table('content_cards', function (Blueprint $table) {
            $table->string('front_image_fit', 16)->nullable()->after('front_image');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('content_cards') || ! Schema::hasColumn('content_cards', 'front_image_fit')) {
            return;
        }

        Schema::table('content_cards', function (Blueprint $table) {
            $table->dropColumn('front_image_fit');
        });
    }
};
