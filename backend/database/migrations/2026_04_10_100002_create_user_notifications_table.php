<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('admin_notification_id')->nullable()->constrained('admin_notifications')->nullOnDelete();
            $table->string('title');
            $table->text('message');
            $table->string('type')->default('push'); // push, email, in_app
            $table->string('icon')->default('bell');
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_read']);
            $table->index('admin_notification_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_notifications');
    }
};
