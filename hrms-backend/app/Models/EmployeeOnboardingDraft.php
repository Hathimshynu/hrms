<?php

namespace App\Models;

use App\Models\Concerns\FormatsModelDates;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmployeeOnboardingDraft extends Model
{
    use FormatsModelDates, HasFactory, SoftDeletes;

    protected $table = 'employee_onboarding_drafts';

    protected $fillable = [
        'employee_id',
        'created_by',
        'updated_by',
        'current_step',
        'completed_steps',
        'form_data',
        'status',
        'last_saved_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'current_step' => 'integer',
            'completed_steps' => 'array',
            'form_data' => 'array',
            'last_saved_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $draft) {
            $draft->completed_steps ??= [];
            $draft->form_data ??= [];
            $draft->status ??= 'draft';
            $draft->current_step ??= 1;
        });
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function isActive(): bool
    {
        return $this->status === 'draft';
    }
}