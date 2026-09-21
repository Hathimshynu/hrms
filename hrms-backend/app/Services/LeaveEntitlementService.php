<?php

namespace App\Services;

use App\Models\LeaveEntitlement;
use App\Models\LeavePolicy;
use App\Models\LeaveRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Entitlement arithmetic. An entitlement is only the allocated number of days
 * for (employee, leave policy, calendar year); usage is always derived from
 * leave_requests, never stored:
 *
 *   remaining               = entitled - approved
 *   available after pending = entitled - approved - pending
 *
 * A leave request belongs to the calendar year of its start date (the same
 * attribution the existing balance endpoint used). Pending requests do not
 * consume the entitlement; the limit is enforced against approved days both
 * when applying and again when approving, so several pending requests can
 * never be approved past the entitlement.
 */
class LeaveEntitlementService
{
    public const NOT_CONFIGURED = 'Leave entitlement is not configured for this employee and leave type.';

    /**
     * Approved and pending days keyed "employeeId|leaveCode|year".
     *
     * @param  array<int, int>  $employeeIds
     * @param  array<int, int>  $years
     * @return array<string, array{approved: float, pending: float}>
     */
    public function usage(array $employeeIds, array $years, ?string $leaveCode = null): array
    {
        if ($employeeIds === [] || $years === []) {
            return [];
        }

        $rows = DB::table('leave_requests')
            ->whereNull('deleted_at')
            ->whereIn('employee_id', $employeeIds)
            ->whereIn('status', ['approved', 'pending'])
            ->whereBetween('start_date', [min($years).'-01-01', max($years).'-12-31'])
            ->when($leaveCode !== null, fn ($q) => $q->where('leave_type', $leaveCode))
            ->selectRaw('employee_id, leave_type, YEAR(start_date) as yr, status, SUM(total_days) as days')
            ->groupBy('employee_id', 'leave_type', 'yr', 'status')
            ->get();

        $usage = [];
        foreach ($rows as $row) {
            $key = $row->employee_id.'|'.$row->leave_type.'|'.$row->yr;
            $usage[$key] ??= ['approved' => 0.0, 'pending' => 0.0];
            $usage[$key][$row->status] = (float) $row->days;
        }

        return $usage;
    }

    /** @return array{approved: float, pending: float} */
    public function usageFor(int $employeeId, string $leaveCode, int $year, ?int $excludeLeaveId = null): array
    {
        $row = DB::table('leave_requests')
            ->whereNull('deleted_at')
            ->where('employee_id', $employeeId)
            ->where('leave_type', $leaveCode)
            ->whereIn('status', ['approved', 'pending'])
            ->whereBetween('start_date', [$year.'-01-01', $year.'-12-31'])
            ->when($excludeLeaveId, fn ($q) => $q->where('id', '!=', $excludeLeaveId))
            ->selectRaw("COALESCE(SUM(CASE WHEN status = 'approved' THEN total_days END), 0) as approved, COALESCE(SUM(CASE WHEN status = 'pending' THEN total_days END), 0) as pending")
            ->first();

        return ['approved' => (float) $row->approved, 'pending' => (float) $row->pending];
    }

    /** @return array<string, float> */
    public function figures(float $entitled, float $approved, float $pending): array
    {
        return [
            'entitled_days' => $entitled,
            'approved_days' => $approved,
            'pending_days' => $pending,
            'remaining_days' => round($entitled - $approved, 2),
            'available_after_pending_days' => round($entitled - $approved - $pending, 2),
        ];
    }

    public function find(int $employeeId, string $leaveCode, int $year): ?LeaveEntitlement
    {
        return LeaveEntitlement::query()
            ->where('employee_id', $employeeId)
            ->where('leave_year', $year)
            ->whereIn('leave_policy_id', LeavePolicy::withTrashed()->where('code', $leaveCode)->select('id'))
            ->first();
    }

    /**
     * Applying for leave: an entitlement must exist and the approved days plus
     * this request must fit inside it. Call inside the request transaction.
     */
    public function assertCanApply(int $employeeId, string $leaveCode, int $year, float $requestedDays): void
    {
        $entitlement = $this->find($employeeId, $leaveCode, $year);

        if (! $entitlement) {
            throw ValidationException::withMessages(['leave_type' => [self::NOT_CONFIGURED]]);
        }

        $usage = $this->usageFor($employeeId, $leaveCode, $year);
        $remaining = (float) $entitlement->entitled_days - $usage['approved'];

        if ($requestedDays > $remaining) {
            throw ValidationException::withMessages([
                'end_date' => [sprintf(
                    'This request needs %s day(s) but only %s day(s) of %s leave remain for %d.',
                    $this->trim($requestedDays),
                    $this->trim(max($remaining, 0)),
                    $leaveCode,
                    $year,
                )],
            ]);
        }
    }

    /** Approving re-checks the limit so concurrent pending requests cannot overdraw it. */
    public function assertCanApprove(LeaveRequest $leave): void
    {
        $year = (int) $leave->start_date->format('Y');
        $entitlement = $this->find($leave->employee_id, $leave->leave_type, $year);

        if (! $entitlement) {
            throw ValidationException::withMessages(['status' => [self::NOT_CONFIGURED]]);
        }

        $usage = $this->usageFor($leave->employee_id, $leave->leave_type, $year, $leave->id);
        $remaining = (float) $entitlement->entitled_days - $usage['approved'];

        if ((float) $leave->total_days > $remaining) {
            throw ValidationException::withMessages([
                'status' => [sprintf(
                    'Approving this request would exceed the entitlement: %s day(s) requested, %s day(s) remain for %d.',
                    $this->trim((float) $leave->total_days),
                    $this->trim(max($remaining, 0)),
                    $year,
                )],
            ]);
        }
    }

    /** An entitlement may not be lower than leave already approved for that year. */
    public function assertEntitledDaysCoverApproved(int $employeeId, string $leaveCode, int $year, float $entitledDays): void
    {
        $approved = $this->usageFor($employeeId, $leaveCode, $year)['approved'];

        if ($entitledDays < $approved) {
            throw ValidationException::withMessages([
                'entitled_days' => [sprintf('Entitlement cannot be lower than the %s day(s) already approved for %d.', $this->trim($approved), $year)],
            ]);
        }
    }

    /** Deleting would orphan approved or pending leave. */
    public function assertCanDelete(LeaveEntitlement $entitlement): void
    {
        $code = (string) LeavePolicy::withTrashed()->whereKey($entitlement->leave_policy_id)->value('code');
        $usage = $this->usageFor($entitlement->employee_id, $code, $entitlement->leave_year);

        if ($usage['approved'] > 0 || $usage['pending'] > 0) {
            throw ValidationException::withMessages([
                'entitlement' => [sprintf(
                    'This entitlement cannot be deleted because it has %s approved and %s pending day(s) of leave.',
                    $this->trim($usage['approved']),
                    $this->trim($usage['pending']),
                )],
            ]);
        }
    }

    private function trim(float $value): string
    {
        $text = rtrim(rtrim(number_format($value, 2, '.', ''), '0'), '.');

        return $text === '' ? '0' : $text;
    }
}
