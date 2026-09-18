<?php

namespace App\Models;

use App\Models\Concerns\FormatsModelDates;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmployeeLeaveAttendance extends Model
{
    use FormatsModelDates, HasFactory, SoftDeletes;

    protected $table = 'employee_leave_attendance';

    protected $fillable = [
        'employee_id',
        'leave_policy_id',
        'attendance_policy_id',
        'work_schedule_id',
        'shift_id',
        'weekly_off_id',
        'late_policy_id',
        'overtime_policy_id',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
    public function leavePolicy(): BelongsTo
{
    return $this->belongsTo(LeavePolicy::class, 'leave_policy_id');
}

    public function attendancePolicy(): BelongsTo
    {
        return $this->belongsTo(AttendancePolicy::class, 'attendance_policy_id');
    }

    public function workSchedule(): BelongsTo
    {
        return $this->belongsTo(WorkSchedule::class, 'work_schedule_id');
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class, 'shift_id');
    }

    public function weeklyOff(): BelongsTo
    {
        return $this->belongsTo(WeeklyOff::class, 'weekly_off_id');
    }

    public function latePolicy(): BelongsTo
    {
        return $this->belongsTo(LatePolicy::class, 'late_policy_id');
    }

    public function overtimePolicy(): BelongsTo
    {
        return $this->belongsTo(OvertimePolicy::class, 'overtime_policy_id');
    }
}