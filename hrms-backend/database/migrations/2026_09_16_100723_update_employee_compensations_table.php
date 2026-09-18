<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employee_compensations', function (Blueprint $table) {
            $table->decimal('monthly_ctc', 12, 2)->nullable()->after('annual_ctc');
            $table->decimal('monthly_basic_salary', 12, 2)->nullable()->after('monthly_ctc');
            $table->decimal('monthly_hra', 12, 2)->nullable()->after('monthly_basic_salary');
            $table->decimal('monthly_special_allowance', 12, 2)->nullable()->after('monthly_hra');
            $table->decimal('monthly_other_allowances', 12, 2)->nullable()->after('monthly_special_allowance');
            $table->decimal('monthly_gross_salary', 12, 2)->nullable()->after('monthly_other_allowances');
            $table->decimal('annual_bonus', 12, 2)->nullable()->after('bonus');
            $table->decimal('employer_pf', 12, 2)->nullable()->after('annual_bonus');
            $table->decimal('employer_esi', 12, 2)->nullable()->after('employer_pf');
            $table->decimal('employer_gratuity', 12, 2)->nullable()->after('employer_esi');
            $table->decimal('other_employer_benefits', 12, 2)->nullable()->after('employer_gratuity');
            $table->decimal('employee_pf', 12, 2)->nullable()->after('other_employer_benefits');
            $table->decimal('employee_esi', 12, 2)->nullable()->after('employee_pf');
            $table->decimal('professional_tax', 12, 2)->nullable()->after('employee_esi');
            $table->date('effective_to')->nullable()->after('effective_from');
            $table->boolean('is_current')->default(true)->after('effective_to');

            $table->index(['employee_id', 'is_current']);
        });
    }

    public function down(): void
    {
        Schema::table('employee_compensations', function (Blueprint $table) {
            $table->dropIndex(['employee_id', 'is_current']);

            $table->dropColumn([
                'monthly_ctc',
                'monthly_basic_salary',
                'monthly_hra',
                'monthly_special_allowance',
                'monthly_other_allowances',
                'monthly_gross_salary',
                'annual_bonus',
                'employer_pf',
                'employer_esi',
                'employer_gratuity',
                'other_employer_benefits',
                'employee_pf',
                'employee_esi',
                'professional_tax',
                'effective_to',
                'is_current',
            ]);
        });
    }
};