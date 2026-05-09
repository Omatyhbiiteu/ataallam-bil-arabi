<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('content_folders')) {
            Schema::create('content_folders', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('lang', 2);
                $table->uuid('parent_id')->nullable();
                $table->string('name');
                $table->string('color', 128)->default('bg-blue-500');
                /** وجهة المحتوى للعرض في لوحة المسئول: en | de | both */
                $table->string('content_lang', 8)->default('en');
                $table->boolean('is_system')->default(true);
                $table->timestamps();

                $table->index(['lang', 'parent_id']);
            });
        }

        if (! Schema::hasTable('content_cards')) {
            Schema::create('content_cards', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('lang', 2);
                $table->uuid('folder_id');
                $table->text('front_text');
                $table->text('back_text');
                $table->longText('front_image')->nullable();
                $table->unsignedBigInteger('next_review')->default(0);
                $table->integer('interval')->default(0);
                $table->integer('reviews')->default(0);
                $table->decimal('ease_factor', 8, 2)->default(2.5);
                $table->string('status', 32)->default('new');
                $table->boolean('is_system')->default(true);
                $table->timestamps();

                $table->index(['lang', 'folder_id']);
            });
        }

        $this->seedDefaultsIfEmpty();
    }

    private function seedDefaultsIfEmpty(): void
    {
        if (! Schema::hasTable('content_folders')) {
            return;
        }

        $enCount = DB::table('content_folders')->where('lang', 'en')->count();
        if ($enCount === 0) {
            $now = now();
            DB::table('content_folders')->insert([
                [
                    'id' => 'system_en_1',
                    'lang' => 'en',
                    'parent_id' => null,
                    'name' => 'Common Words (System)',
                    'color' => 'bg-green-500',
                    'content_lang' => 'en',
                    'is_system' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'id' => 'default_en',
                    'lang' => 'en',
                    'parent_id' => null,
                    'name' => 'My English Cards',
                    'color' => 'bg-blue-500',
                    'content_lang' => 'en',
                    'is_system' => false,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            ]);
        }

        $deCount = DB::table('content_folders')->where('lang', 'de')->count();
        if ($deCount === 0) {
            $now = now();
            DB::table('content_folders')->insert([
                [
                    'id' => 'system_de_1',
                    'lang' => 'de',
                    'parent_id' => null,
                    'name' => 'Häufige Wörter (System)',
                    'color' => 'bg-green-500',
                    'content_lang' => 'de',
                    'is_system' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'id' => 'default_de',
                    'lang' => 'de',
                    'parent_id' => null,
                    'name' => 'Meine deutschen Karten',
                    'color' => 'bg-red-500',
                    'content_lang' => 'de',
                    'is_system' => false,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            ]);
        }

        if (Schema::hasTable('content_cards') && DB::table('content_cards')->count() === 0) {
            $now = now();
            DB::table('content_cards')->insert([
                [
                    'id' => 'en_1',
                    'lang' => 'en',
                    'folder_id' => 'default_en',
                    'front_text' => 'مرحباً',
                    'back_text' => 'Hello',
                    'front_image' => null,
                    'next_review' => $now->getTimestamp() * 1000 - 10000,
                    'interval' => 0,
                    'reviews' => 0,
                    'ease_factor' => 2.5,
                    'status' => 'new',
                    'is_system' => false,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'id' => 'de_1',
                    'lang' => 'de',
                    'folder_id' => 'default_de',
                    'front_text' => 'مرحباً',
                    'back_text' => 'Hallo',
                    'front_image' => null,
                    'next_review' => $now->getTimestamp() * 1000 - 10000,
                    'interval' => 0,
                    'reviews' => 0,
                    'ease_factor' => 2.5,
                    'status' => 'new',
                    'is_system' => false,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('content_cards');
        Schema::dropIfExists('content_folders');
    }
};
