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
        Schema::table('employees', function (Blueprint $table) {
            // SaveEmployeeDraftRequest (step 2) validates 'employment_level'
            // as a free-text string, distinct from the existing unused
            // 'employment_level_id' FK-style column - verified no other
            // column represents it, and EmployeeOnboardingService::saveEmployment()
            // has always attempted to persist it here.
            $table->string('employment_level')->nullable()->after('employment_level_id');

            // SaveEmployeeDraftRequest (step 3) validates 'work_phone' and
            // EmployeeOnboardingService::saveWorkContactAccount() attempts to
            // persist it here - verified no other column or table represents it
            // (unlike 'work_email', which correctly becomes users.email).
            $table->string('work_phone', 20)->nullable()->after('work_mode');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['employment_level', 'work_phone']);
        });
    }
};
