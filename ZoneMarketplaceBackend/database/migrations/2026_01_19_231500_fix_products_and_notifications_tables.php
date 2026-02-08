<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Productos: asegurar columnas usadas por el controlador
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'category')) {
                $table->string('category', 50)->default('Otros')->after('location');
            }
            if (!Schema::hasColumn('products', 'images')) {
                $table->json('images')->nullable()->after('category');
            }
            if (!Schema::hasColumn('products', 'sold')) {
                $table->boolean('sold')->default(false)->after('images');
            }
        });

        // Notificaciones: agregar las columnas requeridas
        Schema::table('notifications', function (Blueprint $table) {
            if (!Schema::hasColumn('notifications', 'user_id')) {
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            }
            if (!Schema::hasColumn('notifications', 'type')) {
                $table->string('type', 50)->default('general');
            }
            if (!Schema::hasColumn('notifications', 'content')) {
                $table->text('content')->nullable();
            }
            if (!Schema::hasColumn('notifications', 'read')) {
                $table->boolean('read')->default(false);
            }
        });
    }

    public function down(): void
    {
        // No eliminamos las columnas para evitar pérdida de datos, solo dejamos vacío
    }
};
