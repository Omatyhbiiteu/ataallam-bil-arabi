<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('sentence_topics')) {
            return;
        }

        // السماح بقيمة both بالإضافة إلى en و de
        DB::statement('ALTER TABLE sentence_topics MODIFY sentence_lang VARCHAR(8) NOT NULL');
    }

    public function down(): void
    {
        if (! Schema::hasTable('sentence_topics')) {
            return;
        }

        DB::statement("UPDATE sentence_topics SET sentence_lang = 'de' WHERE sentence_lang = 'both'");
        DB::statement('ALTER TABLE sentence_topics MODIFY sentence_lang VARCHAR(2) NOT NULL');
    }
};
