<?php

namespace App\Services;

use App\Models\Employee;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

/**
 * Leave-day arithmetic shared by leave requests and absence calculation.
 *
 * Non-working days are the days of the employee's assigned weekly-off master
 * (employee_leave_attendance.weekly_off_id -> weekly_offs.days) and the ACTIVE
 * days of the global holiday calendar (holidays.holiday_date). Holidays are
 * date-only Y-m-d strings and are compared as strings, so no time zone can
 * move them.
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
     * Active holidays inside [from, to] as a Y-m-d => name map. One query, so
     * callers load it once per range instead of once per employee or day.
     *
     * @return array<string, string>
     */
    public function holidays(CarbonInterface $from, CarbonInterface $to): array
    {
        return DB::table('holidays')
            ->where('is_active', true)
            ->whereBetween('holiday_date', [$from->toDateString(), $to->toDateString()])
            ->pluck('name', 'holiday_date')
            ->all();
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
     * Number of days in [from, to] (inclusive) that are neither weekly offs
     * nor holidays.
     *
     * @param  array<int, string>  $weeklyOffDays
     * @param  array<string, string>  $holidays  Y-m-d => name, from holidays()
     */
    public function countWorkingDays(array $weeklyOffDays, CarbonInterface $from, CarbonInterface $to, array $holidays = []): int
    {
        $count = 0;

        for ($day = $from->copy()->startOfDay(); $day->lte($to); $day->addDay()) {
            if ($this->isWeeklyOff($weeklyOffDays, $day) || isset($holidays[$day->toDateString()])) {
                continue;
            }

            $count++;
        }

        return $count;
    }
}
