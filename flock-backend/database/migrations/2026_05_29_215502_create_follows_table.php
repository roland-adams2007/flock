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
        Schema::create('follows', function (Blueprint $table) {
            $table->id();

            // User being followed
            $table->foreignId('following_id')
                ->constrained('users')
                ->onDelete('cascade');

            // User who follows
            $table->foreignId('follower_id')
                ->constrained('users')
                ->onDelete('cascade');

            $table->timestamps();

            $table->unique(['following_id', 'follower_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('follows');
    }
};
