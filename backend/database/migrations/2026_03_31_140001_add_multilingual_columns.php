<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->string('name_hindi')->nullable()->after('name');
            $table->string('name_marathi')->nullable()->after('name_hindi');
        });

        Schema::table('frames', function (Blueprint $table) {
            $table->string('title_hindi')->nullable()->after('title');
            $table->string('title_marathi')->nullable()->after('title_hindi');
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn(['name_hindi', 'name_marathi']);
        });

        Schema::table('frames', function (Blueprint $table) {
            $table->dropColumn(['title_hindi', 'title_marathi']);
        });
    }
};
