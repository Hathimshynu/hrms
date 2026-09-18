<?php

namespace App\Models;

use App\Models\Concerns\FormatsModelDates;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmployeeEmergencyContact extends Model
{
    use FormatsModelDates, HasFactory, SoftDeletes;

    protected $fillable = [
        'employee_id',
        'contact_name',
        'relationship',
        'phone',
        'alternate_phone',
        'address',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}