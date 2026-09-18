<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->decimal('check_in_latitude', 10, 7)->nullable()->after('check_in_at');
            $table->decimal('check_in_longitude', 10, 7)->nullable()->after('check_in_latitude');
            $table->decimal('check_in_accuracy', 8, 2)->nullable()->after('check_in_longitude');
            $table->unsignedInteger('check_in_distance')->nullable()->after('check_in_accuracy');

            $table->decimal('check_out_latitude', 10, 7)->nullable()->after('check_out_at');
            $table->decimal('check_out_longitude', 10, 7)->nullable()->after('check_out_latitude');
            $table->decimal('check_out_accuracy', 8, 2)->nullable()->after('check_out_longitude');
            $table->unsignedInteger('check_out_distance')->nullable()->after('check_out_accuracy');

            $table->string('source', 30)->default('mobile')->after('notes');
            $table->string('device_id', 255)->nullable()->after('source');
            $table->ipAddress('ip_address')->nullable()->after('device_id');

            $table->index('attendance_date');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropIndex(['attendance_date']);

            $table->dropColumn([
                'check_in_latitude',
                'check_in_longitude',
                'check_in_accuracy',
                'check_in_distance',
                'check_out_latitude',
                'check_out_longitude',
                'check_out_accuracy',
                'check_out_distance',
                'source',
                'device_id',
                'ip_address',
            ]);
        });
    }
};