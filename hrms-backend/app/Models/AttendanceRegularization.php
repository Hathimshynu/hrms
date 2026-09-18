<?php

namespace App\Models;

use App\Models\Concerns\FormatsModelDates;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceRegularization extends Model
{
    use HasFactory, SoftDeletes, FormatsModelDates;

    protected $fillable = [
        'attendance_id',
        'employee_id',
        'attendance_date',
        'requested_check_in',
        'requested_check_out',
        'reason',
        'description',
        'status',
        'requested_by',
        'reviewed_by',
        'reviewed_at',
        'reviewer_remarks',
    ];

    protected function casts(): array
    {
        return [
            'attendance_date' => 'date',
            'requested_check_in' => 'datetime',
            'requested_check_out' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function attendance(): BelongsTo
    {
        return $this->belongsTo(Attendance::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}