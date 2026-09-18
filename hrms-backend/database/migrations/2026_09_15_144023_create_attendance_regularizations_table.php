<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_regularizations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('attendance_id')
                ->nullable()
                ->constrained('attendances')
                ->nullOnDelete();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->date('attendance_date');

            $table->dateTime('requested_check_in')->nullable();
            $table->dateTime('requested_check_out')->nullable();

            $table->string('reason', 255);

            $table->text('description')->nullable();

            $table->enum('status', [
                'Pending',
                'Approved',
                'Rejected',
                'Cancelled',
            ])->default('Pending');

            $table->foreignId('requested_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('reviewed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->dateTime('reviewed_at')->nullable();

            $table->text('reviewer_remarks')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index([
                'employee_id',
                'attendance_date',
            ]);

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_regularizations');
    }
};