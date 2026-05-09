<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('plan')->default('free')->after('password');
            $table->string('target_language')->nullable()->after('plan');
            $table->string('avatar')->nullable()->after('target_language');
            $table->unsignedTinyInteger('age')->nullable()->after('avatar');
            $table->string('gender')->nullable()->after('age');
            $table->string('start_level')->nullable()->after('gender');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'plan',
                'target_language',
                'avatar',
                'age',
                'gender',
                'start_level',
            ]);
        });
    }
};
