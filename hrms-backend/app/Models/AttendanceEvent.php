<?php

namespace App\Models;

use App\Models\Concerns\FormatsModelDates;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AttendanceEvent extends Model
{
    use FormatsModelDates,HasFactory;

    protected $fillable = [
        'attendance_id',
        'employee_id',
        'event_type',
        'event_at',
        'latitude',
        'longitude',
        'accuracy',
        'distance',
        'source',
        'device_id',
        'ip_address',
        'notes',
    ];

    protected $casts = [
        'event_at' => 'datetime',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'accuracy' => 'decimal:2',
        'distance' => 'integer',
    ];

    public function attendance()
    {
        return $this->belongsTo(Attendance::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}