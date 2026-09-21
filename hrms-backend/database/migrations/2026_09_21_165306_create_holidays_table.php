<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Global (company-wide) holiday calendar. holiday_date is a date-only value. */
    public function up(): void
    {
        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->date('holiday_date');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique('holiday_date');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('holidays');
    }
};
