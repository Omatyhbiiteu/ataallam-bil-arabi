<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('sentence_topics')) {
            return;
        }

        Schema::create('sentence_topics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('lang', 2); // en|de — مسار المحتوى (لغة التعلّم في التطبيق)
            $table->string('sentence_lang', 2); // en|de — لغة الجمل والوسائط (مجلدات جمل/...)
            $table->string('title', 255);
            $table->string('description', 512)->default('');
            $table->string('level', 32);
            $table->string('sub_level', 16)->nullable();
            $table->string('image', 512)->default('from-blue-500 to-indigo-500');
            $table->string('icon', 64)->nullable();
            $table->string('color', 32)->default('blue');
            $table->string('media_type', 16)->default('none'); // none|image|video
            $table->text('media_url')->nullable();
            $table->json('sentences')->nullable();
            $table->text('grammar_notes')->nullable();
            $table->json('quiz_questions')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['lang', 'sentence_lang', 'level', 'sub_level', 'is_active', 'updated_at'], 'sent_top_lang_slvl_act_upd_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sentence_topics');
    }
};
