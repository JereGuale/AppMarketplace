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
        Schema::table('messages', function (Blueprint $table) {
            // Core relations
            $table->unsignedBigInteger('conversation_id')->nullable()->after('id');
            $table->unsignedBigInteger('sender_id')->nullable()->after('conversation_id');

            // Content
            $table->text('text')->nullable()->after('sender_id');
            $table->string('image')->nullable()->after('text');
            $table->boolean('read')->default(false)->after('image');

            // Indexes
            $table->index(['conversation_id', 'created_at']);

            // Foreign keys (safe add; skip if table missing in some envs)
            $table->foreign('conversation_id')->references('id')->on('conversations')->onDelete('cascade');
            $table->foreign('sender_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            // Drop FKs first
            try { $table->dropForeign(['conversation_id']); } catch (\Throwable $e) {}
            try { $table->dropForeign(['sender_id']); } catch (\Throwable $e) {}

            // Drop indexes
            try { $table->dropIndex(['conversation_id', 'created_at']); } catch (\Throwable $e) {}

            // Drop columns
            $table->dropColumn(['conversation_id', 'sender_id', 'text', 'image', 'read']);
        });
    }
};
