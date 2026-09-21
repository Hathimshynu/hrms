<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\LeaveRequest;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;

/**
 * Derives a per-day status for employees from existing data. Nothing is
 * written: absence is never stored, and no attendance events are faked.
 *
 * Status precedence for each date (first match wins):
 *   present     an attendance row with status Present / Late / Half Day
 *               (recorded attendance is authoritative, even on a holiday)
 *   holiday     an ACTIVE day of the global holiday calendar
 *   weekly_off  the day is in the employee's weekly-off master
 *   leave       an APPROVED leave request covers the date
 *   upcoming    the date is after today (not yet evaluable)
 *   absent      a past/today working day with none of the above
 *
 * Holiday and weekly off sit before leave because leave-day counting excludes
 * both, so a leave request never "uses" those days. When a day is both a
 * holiday and a weekly off it is reported as a holiday. Holidays are derived
 * on the fly; no attendance rows are written for them. Pending leave does not
 * excuse an absence; the row carries `pending_leave = true` so the UI can
 * show it. Dates before the employee's joining date are not emitted.
 */
class AbsenceCalculationService
{
    public const STATUSES = ['present', 'absent', 'leave', 'weekly_off', 'holiday', 'upcoming'];

    public const LABELS = [
        'present' => 'Present',
        'absent' => 'Absent',
        'leave' => 'On Leave',
        'weekly_off' => 'Week Off',
        'holiday' => 'Holiday',
        'upcoming' => 'Upcoming',
    ];

    private const PRESENT_ATTENDANCE = ['Present', 'Late', 'Half Day'];

    public function __construct(private readonly LeaveDayCalculator $days) {}

    /**
     * Four queries regardless of employee count: attendance, leave, holidays
     * (loaded once for the whole range) and the weekly-off relation (eager
     * loaded by the caller or here).
     *
     * @param  Collection<int, Employee>  $employees
     * @return Collection<int, array{employee_id:int,date:string,status:string,pending_leave:bool}>
     */
    public function calculate(Collection $employees, Carbon $from, Carbon $to, ?Carbon $today = null): Collection
    {
        if ($employees->isEmpty()) {
            return collect();
        }

        // Relations are eager loaded below, which needs an Eloquent collection.
        $employees = new EloquentCollection($employees->all());

        $today = ($today ?? now())->copy()->startOfDay();
        $from = $from->copy()->startOfDay();
        $to = $to->copy()->startOfDay();
        $ids = $employees->pluck('id')->all();

        $employees->loadMissing('leaveAttendance.weeklyOff');

        $present = Attendance::query()
            ->whereIn('employee_id', $ids)
            ->whereBetween('attendance_date', [$from->toDateString(), $to->toDateString()])
            ->whereIn('status', self::PRESENT_ATTENDANCE)
            ->get(['employee_id', 'attendance_date'])
            ->mapToGroups(fn ($row) => [$row->employee_id => $row->attendance_date->toDateString()])
            ->map(fn ($dates) => array_flip($dates->all()));

        $leaves = LeaveRequest::query()
            ->whereIn('employee_id', $ids)
            ->whereIn('status', ['approved', 'pending'])
            ->whereDate('start_date', '<=', $to->toDateString())
            ->whereDate('end_date', '>=', $from->toDateString())
            ->get(['employee_id', 'start_date', 'end_date', 'status'])
            ->groupBy('employee_id');

        $holidays = $this->days->holidays($from, $to);

        // Pre-compute the day list once and compare plain Y-m-d strings: the
        // per-employee loop below runs employees x days times (reports call it
        // for hundreds of employees over up to 92 days), so it avoids Carbon.
        $dayList = [];
        for ($d = $from->copy(); $d->lte($to); $d->addDay()) {
            $dayList[] = [$d->toDateString(), $d->englishDayOfWeek];
        }
        $todayKey = $today->toDateString();

        $rows = [];

        foreach ($employees as $employee) {
            $weeklyOff = array_flip($this->days->weeklyOffDays($employee));
            $presentDates = $present->get($employee->id, []);
            $joined = $employee->joining_date ? Carbon::parse($employee->joining_date)->toDateString() : null;
            $requests = $leaves->get($employee->id, collect())
                ->map(fn ($l) => [$l->status, $l->start_date->toDateString(), $l->end_date->toDateString()])
                ->all();

            foreach ($dayList as [$key, $dayName]) {
                if ($joined !== null && $key < $joined) {
                    continue;
                }

                $approved = false;
                $pending = false;
                foreach ($requests as [$leaveStatus, $leaveFrom, $leaveTo]) {
                    if ($leaveFrom <= $key && $leaveTo >= $key) {
                        if ($leaveStatus === 'approved') {
                            $approved = true;
                        } else {
                            $pending = true;
                        }
                    }
                }

                $status = match (true) {
                    isset($presentDates[$key]) => 'present',
                    isset($holidays[$key]) => 'holiday',
                    isset($weeklyOff[$dayName]) => 'weekly_off',
                    $approved => 'leave',
                    $key > $todayKey => 'upcoming',
                    default => 'absent',
                };

                $rows[] = [
                    'employee_id' => $employee->id,
                    'date' => $key,
                    'status' => $status,
                    'pending_leave' => $pending && $status === 'absent',
                ];
            }
        }

        return collect($rows);

    }
}
