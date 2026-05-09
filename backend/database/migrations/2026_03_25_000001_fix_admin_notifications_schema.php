<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * يطابق جدول admin_notifications مع الكود الحالي (admin_user_id + read_at + ticket_id اختياري).
 * بعض البيئات كانت تحتوي جدولًا قديماً بدون admin_user_id فيسبب 500 عند إرسال رسالة دعم.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('admin_notifications')) {
            Schema::create('admin_notifications', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignId('admin_user_id')->constrained('admin_users')->cascadeOnDelete();
                $table->string('kind', 64)->default('support_user_message');
                $table->string('title');
                $table->text('body');
                $table->uuid('ticket_id')->nullable();
                $table->timestamp('read_at')->nullable();
                $table->timestamps();
                $table->index(['admin_user_id', 'read_at']);
            });

            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if (! Schema::hasColumn('admin_notifications', 'admin_user_id')) {
            Schema::table('admin_notifications', function (Blueprint $table) {
                $table->unsignedBigInteger('admin_user_id')->nullable()->after('id');
            });
        }

        if (! Schema::hasColumn('admin_notifications', 'read_at')) {
            Schema::table('admin_notifications', function (Blueprint $table) {
                $table->timestamp('read_at')->nullable();
            });
        }

        $firstAdminId = DB::table('admin_users')->orderBy('id')->value('id');
        if ($firstAdminId) {
            DB::table('admin_notifications')->whereNull('admin_user_id')->update(['admin_user_id' => $firstAdminId]);
        } else {
            DB::table('admin_notifications')->whereNull('admin_user_id')->delete();
        }

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE admin_notifications MODIFY ticket_id CHAR(36) NULL');
        } elseif ($driver === 'sqlite') {
            //
        }

        $this->ensureForeignKeyMysql();
    }

    private function ensureForeignKeyMysql(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        $fkName = 'admin_notifications_admin_user_id_foreign';
        $exists = DB::selectOne(
            'SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = ?',
            ['admin_notifications', $fkName, 'FOREIGN KEY']
        );
        if ($exists) {
            return;
        }

        try {
            DB::statement(
                'ALTER TABLE admin_notifications ADD CONSTRAINT '.$fkName
                .' FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE'
            );
        } catch (\Throwable) {
            //
        }
    }

    public function down(): void
    {
        //
    }
};
