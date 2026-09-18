<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Concerns\FormatsModelDates;

class EmployeeOnboardingEquipment extends Model
{
    use SoftDeletes, FormatsModelDates;
    
    protected $table = 'employee_onboarding_equipment';

    protected $fillable = ['employee_onboarding_id', 'equipment_id', 'status', 'assigned_at', 'returned_at', 'notes'];

    protected $casts = ['assigned_at' => 'datetime', 'returned_at' => 'datetime'];

    public function onboarding(): BelongsTo
    {
        return $this->belongsTo(EmployeeOnboarding::class, 'employee_onboarding_id');
    }

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(Equipment::class, 'equipment_id');
    }
}