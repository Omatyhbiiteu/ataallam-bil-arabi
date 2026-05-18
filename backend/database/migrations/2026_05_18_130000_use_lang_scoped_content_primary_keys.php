<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        if (Schema::hasTable('content_folders')) {
            DB::statement('ALTER TABLE `content_folders` DROP PRIMARY KEY');
            DB::statement('ALTER TABLE `content_folders` ADD PRIMARY KEY (`id`, `lang`)');
        }

        if (Schema::hasTable('content_cards')) {
            DB::statement('ALTER TABLE `content_cards` DROP PRIMARY KEY');
            DB::statement('ALTER TABLE `content_cards` ADD PRIMARY KEY (`id`, `lang`)');
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        if (Schema::hasTable('content_cards')) {
            DB::statement('ALTER TABLE `content_cards` DROP PRIMARY KEY');
            DB::statement('ALTER TABLE `content_cards` ADD PRIMARY KEY (`id`)');
        }

        if (Schema::hasTable('content_folders')) {
            DB::statement('ALTER TABLE `content_folders` DROP PRIMARY KEY');
            DB::statement('ALTER TABLE `content_folders` ADD PRIMARY KEY (`id`)');
        }
    }
};
