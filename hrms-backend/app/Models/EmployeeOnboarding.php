<?php

namespace App\Models;

use App\Models\Concerns\FormatsModelDates;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\EmployeeOnboardingEquipment;
use App\Models\OnboardingChecklist;

class EmployeeOnboarding extends Model
{
    use FormatsModelDates, HasFactory, SoftDeletes;

    protected $table = 'employee_onboarding';

    protected $fillable = [
        'employee_id',
        'onboarding_status',
        'start_date',
        'checklist_id',
        'assigned_buddy_id',
        'temporary_password',
        'hr_notes',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function assignedBuddy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_buddy_id');
    }

    public function equipment()
    {
        return $this->belongsToMany(Equipment::class, 'employee_onboarding_equipment')->withPivot(['status', 'assigned_at', 'returned_at', 'notes'])->withTimestamps();
    }

    public function equipmentRecords(): HasMany
    {
        return $this->hasMany(EmployeeOnboardingEquipment::class, 'employee_onboarding_id');
    }
    public function checklist()
    {
        return $this->belongsTo(OnboardingChecklist::class, 'checklist_id');
    }
}
