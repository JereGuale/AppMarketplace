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
            // Rol: client, provider, admin
            $table->enum('role', ['client', 'provider', 'admin'])->default('client')->after('password');
            
            // Estado de la cuenta: active, banned_temp, banned_perm, suspended
            $table->enum('account_status', ['active', 'banned_temp', 'banned_perm', 'suspended'])->default('active')->after('role');
            
            // Fecha de vencimiento del ban temporal (NULL si no está baneado)
            $table->timestamp('ban_expires_at')->nullable()->after('account_status');
            
            // Razón del ban
            $table->text('ban_reason')->nullable()->after('ban_expires_at');
            
            // Contador de registros exitosos
            $table->integer('successful_transactions')->default(0)->after('ban_reason');
            
            // Última actividad
            $table->timestamp('last_activity_at')->nullable()->after('successful_transactions');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'account_status', 'ban_expires_at', 'ban_reason', 'successful_transactions', 'last_activity_at']);
        });
    }
};
