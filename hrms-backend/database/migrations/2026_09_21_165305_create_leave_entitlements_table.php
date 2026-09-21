<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Manually allocated leave days per employee, leave policy and calendar
     * year. Approved/pending usage is never stored here: it is derived from
     * leave_requests so the two can never disagree.
     */
    public function up(): void
    {
        Schema::create('leave_entitlements', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->foreignId('leave_policy_id')
                ->constrained('leave_policies')
                ->restrictOnDelete();

            $table->unsignedSmallInteger('leave_year');
            $table->decimal('entitled_days', 5, 2);

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('updated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->unique(['employee_id', 'leave_policy_id', 'leave_year'], 'leave_entitlements_employee_policy_year_unique');
            $table->index('leave_policy_id');
            $table->index('leave_year');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_entitlements');
    }
};
