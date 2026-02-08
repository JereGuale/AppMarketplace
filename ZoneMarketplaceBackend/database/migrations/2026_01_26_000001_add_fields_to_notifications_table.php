<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            if (!Schema::hasColumn('notifications', 'user_id')) {
                $table->unsignedBigInteger('user_id')->after('id');
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            }
            if (!Schema::hasColumn('notifications', 'type')) {
                $table->string('type', 50)->default('message')->after('user_id');
            }
            if (!Schema::hasColumn('notifications', 'content')) {
                $table->text('content')->nullable()->after('type');
            }
            if (!Schema::hasColumn('notifications', 'read')) {
                $table->boolean('read')->default(false)->after('content');
            }
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            if (Schema::hasColumn('notifications', 'read')) {
                $table->dropColumn('read');
            }
            if (Schema::hasColumn('notifications', 'content')) {
                $table->dropColumn('content');
            }
            if (Schema::hasColumn('notifications', 'type')) {
                $table->dropColumn('type');
            }
            if (Schema::hasColumn('notifications', 'user_id')) {
                $table->dropForeign(['user_id']);
                $table->dropColumn('user_id');
            }
        });
    }
};
