<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveEntitlement extends Model
{
    protected $fillable = [
        'employee_id',
        'leave_policy_id',
        'leave_year',
        'entitled_days',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'leave_year' => 'integer',
            'entitled_days' => 'decimal:2',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function leavePolicy(): BelongsTo
    {
        return $this->belongsTo(LeavePolicy::class)->withTrashed();
    }
}
