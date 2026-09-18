<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employee_onboarding', function (Blueprint $table) {
            $table->text('temporary_password')->nullable()->after('assigned_buddy_id');
        });
    }

    public function down(): void
    {
        Schema::table('employee_onboarding', function (Blueprint $table) {
            $table->dropColumn('temporary_password');
        });
    }
};