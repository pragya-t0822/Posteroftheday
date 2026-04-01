<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('frame_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('frame_id')->constrained('frames')->cascadeOnDelete();
            $table->string('language', 50);
            $table->string('title');
            $table->timestamps();

            $table->unique(['frame_id', 'language']);
            $table->index('language');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('frame_translations');
    }
};
