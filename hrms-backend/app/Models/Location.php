<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Concerns\FormatsModelDates;

class Location extends Model
{
    use SoftDeletes, FormatsModelDates;

    protected $fillable = [
        'branch_id',
        'code',
        'name',
        'address',
        'city',
        'state',
        'country',
        'postal_code',
        'timezone',
        'latitude',
        'longitude',
        'geofence_radius',
        'is_active',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'geofence_radius' => 'integer',
        'is_active' => 'boolean',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }
}