<?php

namespace App\Models;

use App\Models\Concerns\FormatsModelDates;
use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
    use FormatsModelDates;

    protected $fillable = ['name', 'holiday_date', 'description', 'is_active'];

    protected function casts(): array
    {
        return [
            // Date-only: serialised as Y-m-d so no time zone can shift it.
            'holiday_date' => 'date:Y-m-d',
            'is_active' => 'boolean',
        ];
    }
}
