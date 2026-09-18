<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_events', function (Blueprint $table) {
            $table->id();

            $table->foreignId('attendance_id')
                ->constrained('attendances')
                ->cascadeOnDelete();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->enum('event_type', [
                'CHECK_IN',
                'CHECK_OUT',
                'BREAK_START',
                'BREAK_END'
            ]);

            $table->dateTime('event_at');

            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->decimal('accuracy', 8, 2)->nullable();

            $table->unsignedInteger('distance')->nullable();

            $table->string('source', 30)->default('mobile');
            $table->string('device_id', 255)->nullable();
            $table->ipAddress('ip_address')->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index([
                'employee_id',
                'event_at',
            ]);

            $table->index([
                'attendance_id',
                'event_type',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_events');
    }
};