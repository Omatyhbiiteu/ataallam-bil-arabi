<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * عمود JSON في MySQL مناسب للبيانات المتوسطة؛ LONGTEXT يقلل قيود بعض الإصدارات
 * ويستوعب دروسًا بطول JSON كبير (وسائط/أسئلة) ضمن حدود max_allowed_packet.
 */
return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('curriculum_modules')) {
            return;
        }

        $driver = DB::getDriverName();
        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE `curriculum_modules` MODIFY `lessons` LONGTEXT NULL');
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('curriculum_modules')) {
            return;
        }

        $driver = DB::getDriverName();
        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE `curriculum_modules` MODIFY `lessons` JSON NULL');
        }
    }
};
