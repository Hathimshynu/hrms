<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Report\ReportFilterRequest;
use App\Services\ReportService;
use App\Support\Export\TabularExport;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Arr;

/**
 * Reports & HR analytics. Every route needs `view reports`; anything that
 * touches payroll additionally needs `view payroll` (checked here AND on the
 * route, so `view reports` alone never reveals salary data). Payroll keys are
 * omitted, not zeroed, for callers without `view payroll`. Exports need
 * `export reports` and go through the shared TabularExport writer with exactly
 * the same filters as the on-screen report.
 */
class ReportsController extends Controller
{
    private const REPORTS = ['workforce', 'attendance', 'absence', 'leave', 'leave-balances', 'holidays', 'payroll', 'departments', 'monthly'];

    public function __construct(private readonly ReportService $reports) {}

    private function ok(array $data): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $data]);
    }

    private function canPayroll(ReportFilterRequest $request): bool
    {
        return $request->user('api')->can('view payroll');
    }

    public function summary(ReportFilterRequest $request): JsonResponse
    {
        return $this->ok($this->reports->summary($request, $this->canPayroll($request)));
    }

    public function workforce(ReportFilterRequest $request): JsonResponse
    {
        return $this->ok($this->reports->workforce($request));
    }

    public function attendance(ReportFilterRequest $request): JsonResponse
    {
        return $this->ok(Arr::except($this->reports->attendance($request), ['_all_employees']));
    }

    public function absence(ReportFilterRequest $request): JsonResponse
    {
        return $this->ok(Arr::except($this->reports->attendance($request, true), ['_all_employees']));
    }

    public function leave(ReportFilterRequest $request): JsonResponse
    {
        return $this->ok($this->reports->leave($request));
    }

    public function holidays(ReportFilterRequest $request): JsonResponse
    {
        return $this->ok($this->reports->holidays($request));
    }

    public function payroll(ReportFilterRequest $request): JsonResponse
    {
        $this->requirePayroll($request);

        return $this->ok($this->reports->payroll($request));
    }

    public function departments(ReportFilterRequest $request): JsonResponse
    {
        return $this->ok($this->reports->departments($request, $this->canPayroll($request)));
    }

    public function monthly(ReportFilterRequest $request): JsonResponse
    {
        return $this->ok($this->reports->monthly($request, $this->canPayroll($request)));
    }

    /** Whole filtered dataset of the named report as CSV/XLSX. `export reports`. */
    public function export(ReportFilterRequest $request, string $report)
    {
        abort_unless(in_array($report, self::REPORTS, true), 404, 'Unknown report.');

        $format = $request->string('format', 'csv')->toString();
        $stamp = now()->format('Y-m-d');

        switch ($report) {
            case 'workforce':
                $data = $this->reports->workforce($request);
                $rows = collect($data['by_department'])->map(fn ($d) => [$d['name'], $d['total'], $d['active'], $d['total'] - $d['active']]);

                return TabularExport::download('workforce-'.$stamp, ['Department', 'Employees', 'Active', 'Not Active'], $rows->all(), $format);

            case 'attendance':
            case 'absence':
                $data = $this->reports->attendance($request, $report === 'absence');
                $rows = $data['_all_employees']->map(fn ($e) => [
                    $e['employee_code'], $e['name'], $e['department'], $e['present'], $e['absent'], $e['leave'], $e['weekly_off'], $e['holiday'], $e['upcoming'],
                    $e['attendance_percentage'], $e['pending_leave_days'],
                ]);

                return TabularExport::download(
                    $report.'-'.$data['from_date'].'-to-'.$data['to_date'],
                    ['Employee Code', 'Employee', 'Department', 'Present', 'Absent', 'Approved Leave', 'Week Off', 'Holiday', 'Upcoming', 'Attendance %', 'Pending Leave Days'],
                    $rows->all(),
                    $format,
                );

            case 'leave':
                $data = $this->reports->leave($request, false, false);
                $rows = $data['employees']->map(fn ($e) => [$e['employee_code'], $e['name'], $e['department'], $e['total'], $e['pending'], $e['approved'], $e['rejected'], $e['cancelled'], $e['approved_days']]);

                return TabularExport::download(
                    'leave-'.$data['from_date'].'-to-'.$data['to_date'],
                    ['Employee Code', 'Employee', 'Department', 'Requests', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Approved Days'],
                    $rows->all(),
                    $format,
                );

            case 'leave-balances':
                $year = $request->filled('year') ? $request->integer('year') : (int) now()->format('Y');
                $data = $this->reports->entitlements($request, $year, false);
                $rows = $data['balances']->map(fn ($b) => [$b['employee_code'], $b['name'], $b['department'], $b['leave_type_name'], $year, $b['entitled_days'], $b['approved_days'], $b['pending_days'], $b['remaining_days']]);

                return TabularExport::download(
                    'leave-balances-'.$year,
                    ['Employee Code', 'Employee', 'Department', 'Leave Type', 'Year', 'Entitled Days', 'Approved Days', 'Pending Days', 'Remaining Days'],
                    $rows->all(),
                    $format,
                );

            case 'holidays':
                $data = $this->reports->holidays($request);
                $rows = collect($data['holidays'])->map(fn ($h) => [TabularExport::date($h['holiday_date']), $h['weekday'], $h['name'], $h['description'], $h['is_active'] ? 'Active' : 'Inactive']);

                return TabularExport::download(
                    'holidays-'.$data['from_date'].'-to-'.$data['to_date'],
                    ['Date', 'Day', 'Holiday', 'Description', 'Status'],
                    $rows->all(),
                    $format,
                );

            case 'payroll':
                $this->requirePayroll($request);
                $data = $this->reports->payroll($request, false);
                $rows = $data['employees']->map(fn ($e) => [$e['employee_code'], $e['name'], $e['department'], $e['records'], $e['basic_salary'], $e['gross_salary'], $e['total_deductions'], $e['net_salary']]);
                $period = $request->filled('year') ? $request->integer('year').($request->filled('month') ? '-'.str_pad((string) $request->integer('month'), 2, '0', STR_PAD_LEFT) : '') : $stamp;

                return TabularExport::download(
                    'payroll-report-'.$period,
                    ['Employee Code', 'Employee', 'Department', 'Records', 'Basic Salary', 'Gross Salary', 'Total Deductions', 'Net Salary'],
                    $rows->all(),
                    $format,
                );

            case 'departments':
            case 'monthly':
                $withPayroll = $this->canPayroll($request);
                $data = $report === 'monthly'
                    ? $this->reports->monthly($request, $withPayroll)
                    : $this->reports->departments($request, $withPayroll);
                $headings = ['Department', 'Employees', 'Active Employees', 'Present', 'Absent', 'Approved Leave (attendance days)', 'Week Off', 'Holiday', 'Attendance %', 'Approved Leave Days'];
                if ($withPayroll) {
                    array_push($headings, 'Payroll Gross', 'Payroll Deductions', 'Payroll Net');
                }
                $rows = collect($data['departments'])->map(function ($d) use ($withPayroll) {
                    $row = [$d['name'], $d['employees'], $d['active_employees'], $d['present'], $d['absent'], $d['leave_days_attendance'], $d['weekly_off'], $d['holiday'], $d['attendance_percentage'], $d['approved_leave_days']];
                    if ($withPayroll) {
                        array_push($row, $d['payroll_gross'], $d['payroll_deductions'], $d['payroll_net']);
                    }

                    return $row;
                });

                return TabularExport::download(
                    ($report === 'monthly' ? 'hr-summary-'.$data['period'] : 'departments-'.$data['from_date'].'-to-'.$data['to_date']),
                    $headings,
                    $rows->all(),
                    $format,
                );
        }
    }

    private function requirePayroll(ReportFilterRequest $request): void
    {
        abort_unless($this->canPayroll($request), 403, 'Forbidden: payroll reports require payroll access.');
    }
}
