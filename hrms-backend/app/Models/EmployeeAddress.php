<?php

namespace App\Models;

use App\Models\Concerns\FormatsModelDates;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmployeeAddress extends Model
{
    use FormatsModelDates, HasFactory, SoftDeletes;

    protected $fillable = [
        'employee_id',
        'type',
        'address_line_1',
        'address_line_2',
        'city',
        'state',
        'country',
        'postal_code',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}