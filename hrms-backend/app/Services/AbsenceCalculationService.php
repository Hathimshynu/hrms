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
 * Status precedence for each date:
 *   present     an attendance row with status Present / Late / Half Day
 *   weekly_off  the day is in the employee's weekly-off master
 *   leave       an APPROVED leave request covers the date
 *   upcoming    the date is after today (not yet evaluable)
 *   absent      a past/today working day with none of the above
 *
 * Holidays are not represented anywhere in the schema, so there is no
 * `holiday` status. Pending leave does not excuse an absence; the row carries
 * `pending_leave = true` so the UI can show it. Dates before the employee's
 * joining date are not emitted.
 */
class AbsenceCalculationService
{
    public const STATUSES = ['present', 'absent', 'leave', 'weekly_off', 'upcoming'];

    private const PRESENT_ATTENDANCE = ['Present', 'Late', 'Half Day'];

    public function __construct(private readonly LeaveDayCalculator $days) {}

    /**
     * Three queries regardless of employee count: attendance, leave, and the
     * weekly-off relation (eager loaded by the caller or here).
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

        $rows = collect();

        foreach ($employees as $employee) {
            $weeklyOff = $this->days->weeklyOffDays($employee);
            $employeeLeaves = $leaves->get($employee->id, collect());
            $presentDates = $present->get($employee->id, []);
            $start = $employee->joining_date && Carbon::parse($employee->joining_date)->gt($from)
                ? Carbon::parse($employee->joining_date)->startOfDay()
                : $from->copy();

            for ($day = $start->copy(); $day->lte($to); $day->addDay()) {
                $key = $day->toDateString();

                $approved = $employeeLeaves->contains(fn ($l) => $l->status === 'approved'
                    && $l->start_date->lte($day) && $l->end_date->gte($day));
                $pending = $employeeLeaves->contains(fn ($l) => $l->status === 'pending'
                    && $l->start_date->lte($day) && $l->end_date->gte($day));

                $status = match (true) {
                    isset($presentDates[$key]) => 'present',
                    $this->days->isWeeklyOff($weeklyOff, $day) => 'weekly_off',
                    $approved => 'leave',
                    $day->gt($today) => 'upcoming',
                    default => 'absent',
                };

                $rows->push([
                    'employee_id' => $employee->id,
                    'date' => $key,
                    'status' => $status,
                    'pending_leave' => $pending && $status === 'absent',
                ]);
            }
        }

        return $rows;
    }
}
