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
        Schema::table('employee_education', function (Blueprint $table) {
            // SaveEmployeeDraftRequest (step 9) validates 'university_institution'
            // as nullable, and EmployeeOnboardingService::saveProfessionalInfo()
            // writes it here - but this column was NOT NULL, so saving step 9
            // with that field left blank always threw a raw SQL error. Verified
            // via a live test call. This column matches 'university' (already
            // nullable) in nullability now.
            $table->string('institution')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_education', function (Blueprint $table) {
            $table->string('institution')->nullable(false)->change();
        });
    }
};
