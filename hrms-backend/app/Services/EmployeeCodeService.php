<?php

namespace App\Services;

use App\Models\EmployeeSequence;
use Illuminate\Support\Facades\DB;

class EmployeeCodeService
{
    /**
     * Generate a unique employee code using database-level locking.
     *
     * Format: HRMS001, HRMS002, ..., HRMS999, HRMS1000, ...
     */
    public function generate(string $prefix = 'HRMS'): string
    {
        return DB::transaction(function () use ($prefix) {
            return EmployeeSequence::getNextCode($prefix);
        });
    }
}
