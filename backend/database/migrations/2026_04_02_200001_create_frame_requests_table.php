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
        Schema::create('frame_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('reference_image')->nullable();
            $table->enum('status', ['pending', 'in_progress', 'completed', 'rejected'])->default('pending');
            $table->text('admin_notes')->nullable();
            $table->foreignId('frame_layer_id')->nullable()->constrained('frame_layers')->nullOnDelete();
            $table->string('delivered_file')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index('customer_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('frame_requests');
    }
};
