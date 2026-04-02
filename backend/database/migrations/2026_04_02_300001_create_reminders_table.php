<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reminders', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('occasion')->nullable();
            $table->date('reminder_date');
            $table->json('frame_ids')->nullable();
            $table->json('category_ids')->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index('reminder_date');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reminders');
    }
};
