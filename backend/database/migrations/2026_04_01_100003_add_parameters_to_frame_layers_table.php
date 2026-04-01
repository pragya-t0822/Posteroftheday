<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('frame_layers', function (Blueprint $table) {
            $table->json('parameters')->nullable()->after('sort_order');
        });
    }

    public function down(): void
    {
        Schema::table('frame_layers', function (Blueprint $table) {
            $table->dropColumn('parameters');
        });
    }
};
