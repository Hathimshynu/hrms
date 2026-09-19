<?php

namespace App\Models;

use App\Models\Concerns\FormatsModelDates;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use FormatsModelDates, HasFactory, SoftDeletes;

    protected $fillable = [
        'employee_code',
        'user_id',

        'first_name',
        'last_name',
        'email',
        'phone',
        'alternate_phone',

        'date_of_birth',
        'gender',
        'marital_status',

        'employment_type',
        'joining_date',
        'probation_end_date',

        'department_id',
        'designation_id',

        'reporting_manager_id',
        'employment_level_id',
        'employment_level',

        'work_mode',
        'work_phone',
        'employment_status',
        'lifecycle',

        'profile_photo',
        'address',
        'salary',
        'branch_id',
        'location_id'
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'joining_date' => 'date',
            'probation_end_date' => 'date',
            'salary' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function designation(): BelongsTo
    {
        return $this->belongsTo(Designation::class);
    }

    public function reportingManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporting_manager_id');
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(EmployeeAddress::class);
    }

    public function emergencyContacts(): HasMany
    {
        return $this->hasMany(EmployeeEmergencyContact::class);
    }

    public function compensations(): HasMany
    {
        return $this->hasMany(EmployeeCompensation::class);
    }


    public function bankDetails(): HasMany
    {
        return $this->hasMany(EmployeeBankDetail::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(EmployeeDocument::class);
    }

    public function education(): HasMany
    {
        return $this->hasMany(EmployeeEducation::class);
    }

    public function experiences(): HasMany
    {
        return $this->hasMany(EmployeeExperience::class);
    }

    public function leaveAttendance(): HasOne
    {
        return $this->hasOne(EmployeeLeaveAttendance::class);
    }

    public function onboarding(): HasOne
    {
        return $this->hasOne(EmployeeOnboarding::class);
    }
    public function onboardingDrafts()
    {
        return $this->hasMany(
            EmployeeOnboardingDraft::class
        );
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function reportingEmployees()
    {
        return $this->hasMany(User::class, 'id');
    }
    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }
    public function attendanceEvents()
    {
        return $this->hasMany(AttendanceEvent::class);
    }

    public function attendanceRegularizations()
    {
        return $this->hasMany(AttendanceRegularization::class);
    }
}
