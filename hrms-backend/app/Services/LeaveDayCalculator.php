<?php

namespace App\Services;

use App\Models\Employee;
use Carbon\CarbonInterface;

/**
 * Leave-day arithmetic shared by leave requests and absence calculation.
 *
 * The schema has no holiday calendar, so the only non-working days that can be
 * excluded are the days of the employee's assigned weekly-off master
 * (employee_leave_attendance.weekly_off_id -> weekly_offs.days).
 */
class LeaveDayCalculator
{
    /** Longest range a single leave request or absence query may span. */
    public const MAX_RANGE_DAYS = 366;

    /**
     * Weekly-off day names (e.g. ["Saturday", "Sunday"]) for one employee.
     *
     * @return array<int, string>
     */
    public function weeklyOffDays(Employee $employee): array
    {
        $employee->loadMissing('leaveAttendance.weeklyOff');

        return $this->normalise($employee->leaveAttendance?->weeklyOff?->days);
    }

    /**
     * @param  mixed  $days
     * @return array<int, string>
     */
    public function normalise($days): array
    {
        if (is_string($days)) {
            $days = json_decode($days, true);
        }

        return collect(is_array($days) ? $days : [])
            ->map(fn ($day) => ucfirst(strtolower(trim((string) $day))))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @param  array<int, string>  $weeklyOffDays
     */
    public function isWeeklyOff(array $weeklyOffDays, CarbonInterface $date): bool
    {
        return in_array($date->englishDayOfWeek, $weeklyOffDays, true);
    }

    /**
     * Number of days in [from, to] (inclusive) that are not weekly offs.
     *
     * @param  array<int, string>  $weeklyOffDays
     */
    public function countWorkingDays(array $weeklyOffDays, CarbonInterface $from, CarbonInterface $to): int
    {
        $count = 0;

        for ($day = $from->copy()->startOfDay(); $day->lte($to); $day->addDay()) {
            if (! $this->isWeeklyOff($weeklyOffDays, $day)) {
                $count++;
            }
        }

        return $count;
    }
}
