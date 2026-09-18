<?php

namespace App\Models;

use App\Models\Concerns\FormatsModelDates;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class EmployeeSequence extends Model
{
    use FormatsModelDates;

    protected $fillable = [
        'prefix',
        'current_number',
    ];

    /**
     * Get the next employee code in sequence.
     *
     * Format: HRMS001, HRMS002, ..., HRMS999, HRMS1000, ...
     */
    public static function getNextCode(string $prefix = 'HRMS'): string
    {
        $sequence = DB::transaction(function () use ($prefix) {
            $sequence = static::where('prefix', $prefix)->lockForUpdate()->first();

            if (! $sequence) {
                $sequence = static::create([
                    'prefix' => $prefix,
                    'current_number' => 0,
                ]);
            }

            $sequence->increment('current_number');

            return $sequence;
        });

        $number = $sequence->current_number;

        return $prefix.str_pad((string) $number, max(3, strlen((string) $number)), '0', STR_PAD_LEFT);
    }
}
