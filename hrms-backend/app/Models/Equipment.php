<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Models\Concerns\FormatsModelDates;

class Equipment extends Model
{
    use SoftDeletes, FormatsModelDates;

    protected $table = 'equipment';

    protected $fillable = [
        'name',
        'code',
        'category',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function onboardingRecords(): BelongsToMany
    {
        return $this->belongsToMany(EmployeeOnboarding::class, 'employee_onboarding_equipment')->withPivot(['status', 'assigned_at', 'returned_at', 'notes'])->withTimestamps();
    }
}