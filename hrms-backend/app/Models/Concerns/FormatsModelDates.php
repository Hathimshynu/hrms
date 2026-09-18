<?php

namespace App\Models\Concerns;

use Carbon\Carbon;
use DateTimeInterface;

trait FormatsModelDates
{
    protected function serializeDate(DateTimeInterface $date): string
    {
        return $date->format('Y-m-d H:i:s');
    }
}
