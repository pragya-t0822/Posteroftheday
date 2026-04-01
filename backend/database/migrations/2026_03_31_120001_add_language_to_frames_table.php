<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('frames', function (Blueprint $table) {
            $table->string('language', 20)->default('english')->after('category_id');
            $table->index('language');
        });
    }

    public function down(): void
    {
        Schema::table('frames', function (Blueprint $table) {
            $table->dropIndex(['language']);
            $table->dropColumn('language');
        });
    }
};
