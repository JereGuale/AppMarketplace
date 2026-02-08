<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'sold')) {
                $table->boolean('sold')->default(false)->after('price');
            }
            if (!Schema::hasColumn('products', 'category')) {
                $table->string('category')->nullable()->after('location');
            }
            if (!Schema::hasColumn('products', 'images')) {
                $table->json('images')->nullable()->after('image');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'sold')) {
                $table->dropColumn('sold');
            }
            if (Schema::hasColumn('products', 'category')) {
                $table->dropColumn('category');
            }
            if (Schema::hasColumn('products', 'images')) {
                $table->dropColumn('images');
            }
        });
    }
};
