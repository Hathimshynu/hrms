<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Concerns\FormatsModelDates;

class WeeklyOff extends Model
{
    use SoftDeletes, FormatsModelDates;

    protected $fillable = ['name', 'code', 'days', 'description', 'is_active'];

    protected $casts = ['days' => 'array', 'is_active' => 'boolean'];
}