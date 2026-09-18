<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Concerns\FormatsModelDates;

class Shift extends Model
{
    use SoftDeletes, FormatsModelDates;

    protected $fillable = ['name', 'code', 'start_time', 'end_time', 'working_hours', 'description', 'is_active'];

    protected $casts = ['working_hours' => 'decimal:2', 'is_active' => 'boolean'];
}