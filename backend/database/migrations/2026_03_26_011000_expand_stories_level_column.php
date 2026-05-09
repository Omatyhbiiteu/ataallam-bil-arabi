<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('stories')) {
            return;
        }

        // Avoid doctrine/dbal dependency: use raw ALTER.
        DB::statement("ALTER TABLE `stories` MODIFY `level` VARCHAR(32) NOT NULL");
    }

    public function down(): void
    {
        if (! Schema::hasTable('stories')) {
            return;
        }
        DB::statement("ALTER TABLE `stories` MODIFY `level` VARCHAR(8) NOT NULL");
    }
};

