<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Concerns\FormatsModelDates;

class OvertimePolicy extends Model
{
    use SoftDeletes, FormatsModelDates;

    protected $fillable = ['name', 'code', 'minimum_hours', 'multiplier', 'description', 'is_active'];

    protected $casts = ['minimum_hours' => 'decimal:2', 'multiplier' => 'decimal:2', 'is_active' => 'boolean'];
}