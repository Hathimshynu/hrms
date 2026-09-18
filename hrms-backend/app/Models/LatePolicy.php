<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Concerns\FormatsModelDates;

class LatePolicy extends Model
{
    use SoftDeletes,FormatsModelDates;

    protected $fillable = ['name', 'code', 'grace_minutes', 'max_late_minutes', 'description', 'is_active'];

    protected $casts = ['grace_minutes' => 'integer', 'max_late_minutes' => 'integer', 'is_active' => 'boolean'];
}