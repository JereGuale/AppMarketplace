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
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('buyer_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('seller_id')->constrained('users')->onDelete('cascade');
            $table->integer('rating')->min(1)->max(5);
            $table->text('comment');
            $table->boolean('has_offensive_language')->default(false);
            $table->boolean('is_hidden_by_admin')->default(false);
            $table->timestamp('hidden_at')->nullable();
            $table->foreignId('hidden_by_admin_id')->nullable()->constrained('users')->onDelete('set null');
            $table->text('hide_reason')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
