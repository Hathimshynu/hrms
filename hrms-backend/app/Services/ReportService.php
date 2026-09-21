<?php

namespace App\Services;

use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Read-only reporting over data that already exists. Attendance/absence
 * figures come from AbsenceCalculationService (the single source of truth for
 * present / absent / leave / weekly-off / upcoming); leave and payroll figures
 * are SQL aggregates over `leave_requests` and `payrolls`. Nothing is stored,
 * nothing is invented: metrics the schema cannot support (leave entitlement,
 * holidays, historical headcount / exits) are reported as unavailable.
 *
 * Every method takes the already-validated filter request. Payroll methods
 * must only be reached by callers holding `view payroll` (enforced by routes
 * and by the controller, never by this service).
 */
class ReportService
{
    /** Day-by-day (attendance/absence) reports are capped: employees x days are computed. */
    public const MAX_DAY_RANGE = 92;

    /** Aggregate-only reports (leave, workforce trend) allow up to two years. */
    public const MAX_AGGREGATE_RANGE = 731;

    public const UNAVAILABLE = [
        'leave_entitlement' => 'Leave entitlements are not configured in the leave policy, so allocation, carry-forward and remaining balance cannot be reported.',
        'holidays' => 'There is no holiday calendar in the system, so holidays are not part of any report.',
        'opening_workforce' => 'The system stores no exit date or status history, so opening headcount for a past period cannot be calculated defensibly.',
    ];

    public function __construct(private readonly AbsenceCalculationService $absence) {}

    // ------------------------------------------------------------------
    // Filters
    // ------------------------------------------------------------------

    /** @return array{0: Carbon, 1: Carbon} */
    public function range(Request $request, int $maxDays, int $defaultDays = 30): array
    {
        $today = now()->startOfDay();
        $to = $request->filled('to_date') ? Carbon::createFromFormat('Y-m-d', $request->string('to_date')->toString())->startOfDay() : $today->copy();
        $from = $request->filled('from_date')
            ? Carbon::createFromFormat('Y-m-d', $request->string('from_date')->toString())->startOfDay()
            : $to->copy()->subDays($defaultDays - 1);

        if ($from->diffInDays($to) >= $maxDays) {
            throw ValidationException::withMessages(['to_date' => ['The date range cannot exceed '.$maxDays.' days for this report.']]);
        }

        return [$from, $to];
    }

    public function paginate(Collection $rows, Request $request): LengthAwarePaginator
    {
        $perPage = $request->integer('per_page', 20);
        $page = max(1, $request->integer('page', 1));

        return new LengthAwarePaginator($rows->forPage($page, $perPage)->values(), $rows->count(), $perPage, $page);
    }

    /** Sort a collection by a whitelisted column; unknown columns fall back to the default. */
    public function sorted(Collection $rows, Request $request, array $allowed, string $default, string $defaultDir = 'asc'): Collection
    {
        $by = $request->string('sort_by')->toString();
        $by = in_array($by, $allowed, true) ? $by : $default;
        $dir = strtolower($request->string('sort_dir')->toString());
        $dir = in_array($dir, ['asc', 'desc'], true) ? $dir : $defaultDir;

        return $rows->sortBy($by, SORT_NATURAL | SORT_FLAG_CASE, $dir === 'desc')->values();
    }

    // ------------------------------------------------------------------
    // Workforce (SQL)
    // ------------------------------------------------------------------

    /** @return array<string, mixed> */
    public function workforce(Request $request): array
    {
        [$from, $to] = $this->range($request, self::MAX_AGGREGATE_RANGE, 365);

        $base = fn () => DB::table('employees')->whereNull('employees.deleted_at')
            ->when($request->filled('department_id'), fn ($q) => $q->where('employees.department_id', $request->integer('department_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('employees.employment_status', $request->string('status')->toString()));

        $group = fn (string $column) => $base()
            ->selectRaw("COALESCE(NULLIF(employees.{$column}, ''), 'Not specified') as label, COUNT(*) as total, SUM(employees.employment_status = 'Active') as active")
            ->groupBy('label')->orderByDesc('total')->get()
            ->map(fn ($r) => ['label' => $r->label, 'total' => (int) $r->total, 'active' => (int) $r->active])->all();

        $byStatus = $base()->selectRaw('employees.employment_status as label, COUNT(*) as total')
            ->groupBy('label')->orderByDesc('total')->get()
            ->map(fn ($r) => ['label' => $r->label, 'total' => (int) $r->total])->all();

        $total = (int) $base()->count();
        $active = (int) $base()->where('employees.employment_status', 'Active')->count();

        $byDepartment = $base()
            ->leftJoin('departments', 'departments.id', '=', 'employees.department_id')
            ->selectRaw("employees.department_id as id, COALESCE(departments.name, 'No department') as name, COUNT(*) as total, SUM(employees.employment_status = 'Active') as active")
            ->groupBy('employees.department_id', 'departments.name')->orderByDesc('total')->get()
            ->map(fn ($r) => ['id' => $r->id, 'name' => $r->name, 'total' => (int) $r->total, 'active' => (int) $r->active])->all();

        $byDesignation = $base()
            ->leftJoin('designations', 'designations.id', '=', 'employees.designation_id')
            ->selectRaw("COALESCE(designations.name, 'No designation') as label, COUNT(*) as total, SUM(employees.employment_status = 'Active') as active")
            ->groupBy('designations.name')->orderByDesc('total')->get()
            ->map(fn ($r) => ['label' => $r->label, 'total' => (int) $r->total, 'active' => (int) $r->active])->all();

        $joined = $base()->whereNotNull('employees.joining_date')
            ->whereBetween('employees.joining_date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw("DATE_FORMAT(employees.joining_date, '%Y-%m') as ym, COUNT(*) as total")
            ->groupBy('ym')->pluck('total', 'ym');

        $trend = [];
        for ($m = $from->copy()->startOfMonth(); $m->lte($to); $m->addMonth()) {
            $trend[] = ['month' => $m->format('Y-m'), 'joiners' => (int) ($joined[$m->format('Y-m')] ?? 0)];
        }

        return [
            'from_date' => $from->toDateString(),
            'to_date' => $to->toDateString(),
            'totals' => [
                'employees' => $total,
                'active' => $active,
                'inactive' => $total - $active,
                'joined_in_period' => (int) collect($trend)->sum('joiners'),
            ],
            'by_status' => $byStatus,
            'by_department' => $byDepartment,
            'by_designation' => $byDesignation,
            'by_gender' => $group('gender'),
            'by_employment_type' => $group('employment_type'),
            'by_work_mode' => $group('work_mode'),
            'joining_trend' => $trend,
            'unavailable' => ['opening_workforce' => self::UNAVAILABLE['opening_workforce']],
        ];
    }

    // ------------------------------------------------------------------
    // Attendance / absence (existing AbsenceCalculationService)
    // ------------------------------------------------------------------

    /**
     * One pass over ACTIVE employees in chunks; per-chunk rows come from the
     * absence service and are folded into totals, per-date, per-department and
     * per-employee counters so memory stays bounded by employees, not days.
     *
     * @return array<string, mixed>
     */
    public function dayMatrix(Carbon $from, Carbon $to, ?int $departmentId, ?int $employeeId): array
    {
        // The overview asks for summary + attendance + departments together and each needs this
        // same expensive matrix, so it is memoised for a minute per exact filter set
        // (attendance/leave edits appear within that minute).
        return Cache::remember(
            sprintf('reports:daymatrix:%s:%s:%s:%s', $from->toDateString(), $to->toDateString(), $departmentId ?? 'all', $employeeId ?? 'all'),
            60,
            fn () => $this->computeDayMatrix($from, $to, $departmentId, $employeeId),
        );
    }

    /** @return array<string, mixed> */
    private function computeDayMatrix(Carbon $from, Carbon $to, ?int $departmentId, ?int $employeeId): array
    {
        $zero = fn () => array_fill_keys(AbsenceCalculationService::STATUSES, 0);
        $total = $zero();
        $byDate = [];
        $byDept = [];
        $byEmployee = [];
        $pendingLeaveDays = 0;

        Employee::query()
            ->where('employment_status', 'Active')
            ->when($departmentId, fn ($q) => $q->where('department_id', $departmentId))
            ->when($employeeId, fn ($q) => $q->where('id', $employeeId))
            ->with('department:id,name')
            ->orderBy('id')
            ->chunkById(300, function ($chunk) use ($from, $to, &$total, &$byDate, &$byDept, &$byEmployee, &$pendingLeaveDays, $zero) {
                $meta = $chunk->keyBy('id');

                foreach ($this->absence->calculate($chunk, $from, $to) as $row) {
                    $status = $row['status'];
                    $employee = $meta[$row['employee_id']];
                    $deptKey = $employee->department_id ?? 0;

                    $total[$status]++;
                    $byDate[$row['date']] ??= $zero();
                    $byDate[$row['date']][$status]++;
                    $byDept[$deptKey] ??= ['name' => $employee->department?->name ?? 'No department'] + $zero();
                    $byDept[$deptKey][$status]++;
                    $byEmployee[$employee->id] ??= [
                        'employee_id' => $employee->id,
                        'employee_code' => $employee->employee_code,
                        'name' => trim($employee->first_name.' '.$employee->last_name),
                        'department' => $employee->department?->name,
                        'pending_leave_days' => 0,
                    ] + $zero();
                    $byEmployee[$employee->id][$status]++;

                    if ($row['pending_leave']) {
                        $byEmployee[$employee->id]['pending_leave_days']++;
                        $pendingLeaveDays++;
                    }
                }
            });

        ksort($byDate);

        return compact('total', 'byDate', 'byDept', 'byEmployee', 'pendingLeaveDays');
    }

    /** present / (present + absent): only days on which attendance was actually expected. */
    public function percentage(array $counts): ?float
    {
        $expected = ($counts['present'] ?? 0) + ($counts['absent'] ?? 0);

        return $expected > 0 ? round(($counts['present'] ?? 0) / $expected * 100, 1) : null;
    }

    /** @return array<string, mixed> */
    public function attendance(Request $request, bool $absenceView = false): array
    {
        [$from, $to] = $this->range($request, self::MAX_DAY_RANGE);
        $deptId = $request->filled('department_id') ? $request->integer('department_id') : null;
        $empId = $request->filled('employee_id') ? $request->integer('employee_id') : null;
        $m = $this->dayMatrix($from, $to, $deptId, $empId);

        $employees = collect($m['byEmployee'])->map(fn ($e) => $e + ['attendance_percentage' => $this->percentage($e)]);

        if ($request->filled('status')) {
            $status = $request->string('status')->toString();
            $employees = $employees->filter(fn ($e) => ($e[$status] ?? 0) > 0)->values();
        }

        $employees = $this->sorted(
            $employees,
            $request,
            ['name', 'employee_code', 'department', 'present', 'absent', 'leave', 'weekly_off', 'upcoming', 'attendance_percentage', 'pending_leave_days'],
            $absenceView ? 'absent' : 'name',
            $absenceView ? 'desc' : 'asc',
        );

        // Late / half-day days and regularization requests: real attendance/regularization data.
        $ids = fn () => DB::table('employees')->whereNull('deleted_at')->where('employment_status', 'Active')
            ->when($deptId, fn ($q) => $q->where('department_id', $deptId))
            ->when($empId, fn ($q) => $q->where('id', $empId))->select('id');

        $att = DB::table('attendances')->whereNull('deleted_at')
            ->whereIn('employee_id', $ids())
            ->whereBetween('attendance_date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw("SUM(status = 'Late') as late, SUM(status = 'Half Day') as half_day")->first();

        $reg = DB::table('attendance_regularizations')->whereNull('deleted_at')
            ->whereIn('employee_id', $ids())
            ->whereBetween('attendance_date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('status, COUNT(*) as total')->groupBy('status')->pluck('total', 'status');

        return [
            'from_date' => $from->toDateString(),
            'to_date' => $to->toDateString(),
            'summary' => $m['total'] + [
                'attendance_percentage' => $this->percentage($m['total']),
                'pending_leave_days' => $m['pendingLeaveDays'],
                'late_days' => (int) ($att->late ?? 0),
                'half_days' => (int) ($att->half_day ?? 0),
                'employees' => count($m['byEmployee']),
            ],
            'regularizations' => [
                'pending' => (int) ($reg['Pending'] ?? 0),
                'approved' => (int) ($reg['Approved'] ?? 0),
                'rejected' => (int) ($reg['Rejected'] ?? 0),
                'cancelled' => (int) ($reg['Cancelled'] ?? 0),
            ],
            'daily' => collect($m['byDate'])->map(fn ($c, $d) => ['date' => $d] + $c)->values()->all(),
            'by_department' => collect($m['byDept'])->map(fn ($c) => $c + ['attendance_percentage' => $this->percentage($c)])->sortBy('name')->values()->all(),
            'employees' => $this->paginate($employees, $request),
            '_all_employees' => $employees,
            'unavailable' => ['holidays' => self::UNAVAILABLE['holidays']],
        ];
    }

    // ------------------------------------------------------------------
    // Leave (SQL over leave_requests)
    // ------------------------------------------------------------------

    private function leaveBase(Request $request, Carbon $from, Carbon $to)
    {
        return DB::table('leave_requests')
            ->join('employees', 'employees.id', '=', 'leave_requests.employee_id')
            ->whereNull('leave_requests.deleted_at')->whereNull('employees.deleted_at')
            // requests overlapping the window
            ->whereDate('leave_requests.start_date', '<=', $to->toDateString())
            ->whereDate('leave_requests.end_date', '>=', $from->toDateString())
            ->when($request->filled('status'), fn ($q) => $q->where('leave_requests.status', $request->string('status')->toString()))
            ->when($request->filled('leave_type'), fn ($q) => $q->where('leave_requests.leave_type', $request->string('leave_type')->toString()))
            ->when($request->filled('department_id'), fn ($q) => $q->where('employees.department_id', $request->integer('department_id')))
            ->when($request->filled('employee_id'), fn ($q) => $q->where('leave_requests.employee_id', $request->integer('employee_id')));
    }

    /** @return array<string, mixed> */
    public function leave(Request $request, bool $paginated = true): array
    {
        [$from, $to] = $this->range($request, self::MAX_AGGREGATE_RANGE, 180);
        $base = fn () => $this->leaveBase($request, $from, $to);
        $statuses = ['pending', 'approved', 'rejected', 'cancelled'];

        $byStatus = $base()->selectRaw('leave_requests.status as status, COUNT(*) as total, COALESCE(SUM(leave_requests.total_days),0) as days')
            ->groupBy('status')->get()->keyBy('status');

        $summary = ['total_requests' => (int) $byStatus->sum('total')];
        foreach ($statuses as $s) {
            $summary[$s] = (int) ($byStatus[$s]->total ?? 0);
        }
        $summary['approved_days'] = (float) ($byStatus['approved']->days ?? 0);

        $types = DB::table('leave_policies')->pluck('name', 'code');
        $byType = $base()->selectRaw("leave_requests.leave_type as code, COUNT(*) as total, SUM(leave_requests.status = 'approved') as approved, COALESCE(SUM(CASE WHEN leave_requests.status = 'approved' THEN leave_requests.total_days END),0) as approved_days")
            ->groupBy('code')->orderByDesc('total')->get()
            ->map(fn ($r) => ['code' => $r->code, 'name' => $types[$r->code] ?? $r->code, 'total' => (int) $r->total, 'approved' => (int) $r->approved, 'approved_days' => (float) $r->approved_days])->all();

        $byDepartment = $base()->leftJoin('departments', 'departments.id', '=', 'employees.department_id')
            ->selectRaw("COALESCE(departments.name, 'No department') as name, COUNT(*) as total, SUM(leave_requests.status = 'approved') as approved, COALESCE(SUM(CASE WHEN leave_requests.status = 'approved' THEN leave_requests.total_days END),0) as approved_days")
            ->groupBy('departments.name')->orderByDesc('total')->get()
            ->map(fn ($r) => ['name' => $r->name, 'total' => (int) $r->total, 'approved' => (int) $r->approved, 'approved_days' => (float) $r->approved_days])->all();

        $monthly = $base()->selectRaw("DATE_FORMAT(leave_requests.start_date, '%Y-%m') as ym, leave_requests.status as status, COUNT(*) as total, COALESCE(SUM(leave_requests.total_days),0) as days")
            ->groupBy('ym', 'status')->get()->groupBy('ym');
        $trend = [];
        for ($m = $from->copy()->startOfMonth(); $m->lte($to); $m->addMonth()) {
            $rows = $monthly->get($m->format('Y-m'), collect())->keyBy('status');
            $point = ['month' => $m->format('Y-m')];
            foreach ($statuses as $s) {
                $point[$s] = (int) ($rows[$s]->total ?? 0);
            }
            $point['approved_days'] = (float) ($rows['approved']->days ?? 0);
            $trend[] = $point;
        }

        $employeesQuery = $base()->selectRaw("leave_requests.employee_id as employee_id, employees.employee_code as employee_code, CONCAT(employees.first_name, ' ', employees.last_name) as name, employees.department_id as department_id, COUNT(*) as total, SUM(leave_requests.status = 'pending') as pending, SUM(leave_requests.status = 'approved') as approved, SUM(leave_requests.status = 'rejected') as rejected, SUM(leave_requests.status = 'cancelled') as cancelled, COALESCE(SUM(CASE WHEN leave_requests.status = 'approved' THEN leave_requests.total_days END),0) as approved_days")
            ->groupBy('leave_requests.employee_id', 'employees.employee_code', 'employees.first_name', 'employees.last_name', 'employees.department_id');

        $sortable = ['name', 'employee_code', 'total', 'pending', 'approved', 'rejected', 'cancelled', 'approved_days'];
        $by = in_array($request->string('sort_by')->toString(), $sortable, true) ? $request->string('sort_by')->toString() : 'approved_days';
        $dir = strtolower($request->string('sort_dir')->toString()) === 'asc' ? 'asc' : 'desc';
        $employeesQuery->orderBy($by, $dir)->orderBy('employee_id');

        $deptNames = DB::table('departments')->pluck('name', 'id');
        $mapEmployee = fn ($r) => [
            'employee_id' => $r->employee_id,
            'employee_code' => $r->employee_code,
            'name' => $r->name,
            'department' => $deptNames[$r->department_id] ?? null,
            'total' => (int) $r->total,
            'pending' => (int) $r->pending,
            'approved' => (int) $r->approved,
            'rejected' => (int) $r->rejected,
            'cancelled' => (int) $r->cancelled,
            'approved_days' => (float) $r->approved_days,
        ];

        $employees = $paginated
            ? $employeesQuery->paginate($request->integer('per_page', 20))->through($mapEmployee)
            : $employeesQuery->get()->map($mapEmployee);

        return [
            'from_date' => $from->toDateString(),
            'to_date' => $to->toDateString(),
            'summary' => $summary,
            'by_type' => $byType,
            'by_department' => $byDepartment,
            'monthly' => $trend,
            'employees' => $employees,
            'unavailable' => ['leave_entitlement' => self::UNAVAILABLE['leave_entitlement']],
            'note' => 'Requests are counted when they overlap the selected dates; the monthly trend and approved days are attributed to the month the leave starts.',
        ];
    }

    // ------------------------------------------------------------------
    // Payroll (SQL) - callers must hold `view payroll`
    // ------------------------------------------------------------------

    private function payrollBase(Request $request)
    {
        return DB::table('payrolls')
            ->join('employees', 'employees.id', '=', 'payrolls.employee_id')
            ->whereNull('payrolls.deleted_at')->whereNull('employees.deleted_at')
            ->when($request->filled('year'), fn ($q) => $q->where('payrolls.payroll_year', $request->integer('year')))
            ->when($request->filled('month'), fn ($q) => $q->where('payrolls.payroll_month', $request->integer('month')))
            ->when($request->filled('status'), fn ($q) => $q->where('payrolls.status', $request->string('status')->toString()))
            ->when($request->filled('department_id'), fn ($q) => $q->where('employees.department_id', $request->integer('department_id')))
            ->when($request->filled('employee_id'), fn ($q) => $q->where('payrolls.employee_id', $request->integer('employee_id')));
    }

    private const PAYROLL_SUMS = 'COUNT(*) as records, COALESCE(SUM(payrolls.basic_salary),0) as basic, COALESCE(SUM(payrolls.gross_salary),0) as gross, COALESCE(SUM(payrolls.total_deductions),0) as deductions, COALESCE(SUM(payrolls.net_salary),0) as net';

    private function money($r): array
    {
        return [
            'records' => (int) $r->records,
            'basic_salary' => round((float) $r->basic, 2),
            'gross_salary' => round((float) $r->gross, 2),
            'total_deductions' => round((float) $r->deductions, 2),
            'net_salary' => round((float) $r->net, 2),
        ];
    }

    /** @return array<string, mixed> */
    public function payroll(Request $request, bool $paginated = true): array
    {
        $base = fn () => $this->payrollBase($request);

        $totals = $this->money($base()->selectRaw(self::PAYROLL_SUMS)->first());

        $byMonth = $base()->selectRaw('payrolls.payroll_year as year, payrolls.payroll_month as month, '.self::PAYROLL_SUMS)
            ->groupBy('year', 'month')->orderBy('year')->orderBy('month')->get()
            ->map(fn ($r) => ['year' => (int) $r->year, 'month' => (int) $r->month, 'label' => sprintf('%04d-%02d', $r->year, $r->month)] + $this->money($r))->all();

        $byDepartment = $base()->leftJoin('departments', 'departments.id', '=', 'employees.department_id')
            ->selectRaw("COALESCE(departments.name, 'No department') as name, ".self::PAYROLL_SUMS)
            ->groupBy('departments.name')->orderByDesc('gross')->get()
            ->map(fn ($r) => ['name' => $r->name] + $this->money($r))->all();

        $byStatus = $base()->selectRaw('payrolls.status as status, '.self::PAYROLL_SUMS)
            ->groupBy('status')->get()
            ->map(fn ($r) => ['status' => $r->status] + $this->money($r))->all();

        $q = $base()->leftJoin('departments', 'departments.id', '=', 'employees.department_id')
            ->selectRaw("payrolls.employee_id as employee_id, employees.employee_code as employee_code, CONCAT(employees.first_name, ' ', employees.last_name) as name, departments.name as department, COUNT(*) as records, COALESCE(SUM(payrolls.basic_salary),0) as basic, COALESCE(SUM(payrolls.gross_salary),0) as gross, COALESCE(SUM(payrolls.total_deductions),0) as deductions, COALESCE(SUM(payrolls.net_salary),0) as net")
            ->groupBy('payrolls.employee_id', 'employees.employee_code', 'employees.first_name', 'employees.last_name', 'departments.name');

        $sortable = ['name', 'employee_code', 'records', 'basic', 'gross', 'deductions', 'net'];
        $by = in_array($request->string('sort_by')->toString(), $sortable, true) ? $request->string('sort_by')->toString() : 'net';
        $dir = strtolower($request->string('sort_dir')->toString()) === 'asc' ? 'asc' : 'desc';
        $q->orderBy($by, $dir)->orderBy('employee_id');

        $map = fn ($r) => [
            'employee_id' => $r->employee_id,
            'employee_code' => $r->employee_code,
            'name' => $r->name,
            'department' => $r->department,
        ] + $this->money($r);

        return [
            'totals' => $totals,
            'by_month' => $byMonth,
            'by_department' => $byDepartment,
            'by_status' => $byStatus,
            'employees' => $paginated ? $q->paginate($request->integer('per_page', 20))->through($map) : $q->get()->map($map),
            'note' => 'Figures are the stored payroll records only. Statutory deductions, bonus, overtime and loss of pay are not calculated by the system.',
        ];
    }

    // ------------------------------------------------------------------
    // Departments (combines the above; payroll only when authorised)
    // ------------------------------------------------------------------

    /** @return array<string, mixed> */
    public function departments(Request $request, bool $withPayroll): array
    {
        [$from, $to] = $this->range($request, self::MAX_DAY_RANGE);
        $matrix = $this->dayMatrix($from, $to, $request->filled('department_id') ? $request->integer('department_id') : null, null);

        $headcount = DB::table('departments')->whereNull('departments.deleted_at')
            ->when($request->filled('department_id'), fn ($q) => $q->where('departments.id', $request->integer('department_id')))
            ->leftJoin('employees', fn ($j) => $j->on('employees.department_id', '=', 'departments.id')->whereNull('employees.deleted_at'))
            ->selectRaw("departments.id as id, departments.name as name, COUNT(employees.id) as employees, COALESCE(SUM(employees.employment_status = 'Active'),0) as active")
            ->groupBy('departments.id', 'departments.name')->orderBy('departments.name')->get();

        $leave = DB::table('leave_requests')->join('employees', 'employees.id', '=', 'leave_requests.employee_id')
            ->whereNull('leave_requests.deleted_at')->whereNull('employees.deleted_at')->where('leave_requests.status', 'approved')
            ->whereBetween('leave_requests.start_date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('employees.department_id as dept, COALESCE(SUM(leave_requests.total_days),0) as days')->groupBy('dept')->pluck('days', 'dept');

        $payroll = collect();
        if ($withPayroll) {
            $fromKey = $from->year * 100 + $from->month;
            $toKey = $to->year * 100 + $to->month;
            $payroll = DB::table('payrolls')->join('employees', 'employees.id', '=', 'payrolls.employee_id')
                ->whereNull('payrolls.deleted_at')->whereNull('employees.deleted_at')
                ->whereRaw('(payrolls.payroll_year * 100 + payrolls.payroll_month) BETWEEN ? AND ?', [$fromKey, $toKey])
                ->selectRaw('employees.department_id as dept, '.self::PAYROLL_SUMS)->groupBy('dept')->get()->keyBy('dept');
        }

        $rows = $headcount->map(function ($d) use ($matrix, $leave, $payroll, $withPayroll) {
            $c = $matrix['byDept'][$d->id] ?? array_fill_keys(AbsenceCalculationService::STATUSES, 0);
            $row = [
                'id' => $d->id,
                'name' => $d->name,
                'employees' => (int) $d->employees,
                'active_employees' => (int) $d->active,
                'present' => $c['present'],
                'absent' => $c['absent'],
                'leave_days_attendance' => $c['leave'],
                'weekly_off' => $c['weekly_off'],
                'attendance_percentage' => $this->percentage($c),
                'approved_leave_days' => (float) ($leave[$d->id] ?? 0),
            ];

            if ($withPayroll) {
                $p = $payroll[$d->id] ?? null;
                $row += [
                    'payroll_gross' => $p ? round((float) $p->gross, 2) : 0.0,
                    'payroll_deductions' => $p ? round((float) $p->deductions, 2) : 0.0,
                    'payroll_net' => $p ? round((float) $p->net, 2) : 0.0,
                ];
            }

            return $row;
        })->values()->all();

        return [
            'from_date' => $from->toDateString(),
            'to_date' => $to->toDateString(),
            'departments' => $rows,
            'includes_payroll' => $withPayroll,
            'note' => 'Attendance covers active employees over the selected dates. Approved leave days are attributed to the day the leave starts. Payroll (when shown) covers payroll months inside the selected dates.',
        ];
    }

    // ------------------------------------------------------------------
    // Monthly HR summary
    // ------------------------------------------------------------------

    /** @return array<string, mixed> */
    public function monthly(Request $request, bool $withPayroll): array
    {
        $period = $request->filled('period') ? $request->string('period')->toString() : now()->format('Y-m');
        $start = Carbon::createFromFormat('Y-m-d', $period.'-01')->startOfDay();
        $end = $start->copy()->endOfMonth()->startOfDay();

        $sub = Request::create('/', 'GET', array_filter([
            'from_date' => $start->toDateString(),
            'to_date' => $end->toDateString(),
            'department_id' => $request->filled('department_id') ? $request->integer('department_id') : null,
        ]));

        $employees = DB::table('employees')->whereNull('deleted_at')
            ->when($request->filled('department_id'), fn ($q) => $q->where('department_id', $request->integer('department_id')));

        $activeAtMonthEnd = (int) (clone $employees)->where('employment_status', 'Active')
            ->where(fn ($q) => $q->whereNull('joining_date')->orWhere('joining_date', '<=', $end->toDateString()))->count();
        $joiners = (int) (clone $employees)->whereBetween('joining_date', [$start->toDateString(), $end->toDateString()])->count();

        $attendance = $this->attendance($sub);
        $leave = $this->leave($sub, false);
        $departments = $this->departments($sub, $withPayroll);

        $out = [
            'period' => $period,
            'from_date' => $start->toDateString(),
            'to_date' => $end->toDateString(),
            'workforce' => [
                'active_employees' => $activeAtMonthEnd,
                'new_joiners' => $joiners,
                'opening_workforce' => null,
            ],
            'attendance' => $attendance['summary'],
            'leave' => $leave['summary'],
            'departments' => $departments['departments'],
            'includes_payroll' => $withPayroll,
            'unavailable' => [
                'opening_workforce' => self::UNAVAILABLE['opening_workforce'],
                'leave_entitlement' => self::UNAVAILABLE['leave_entitlement'],
            ],
        ];

        if ($withPayroll) {
            $payReq = Request::create('/', 'GET', array_filter([
                'year' => $start->year,
                'month' => $start->month,
                'department_id' => $request->filled('department_id') ? $request->integer('department_id') : null,
            ]));
            $out['payroll'] = $this->payroll($payReq, false)['totals'];
        }

        return $out;
    }

    // ------------------------------------------------------------------
    // Summary cards
    // ------------------------------------------------------------------

    /** @return array<string, mixed> */
    public function summary(Request $request, bool $withPayroll): array
    {
        $workforce = $this->workforce($request);
        $attendance = $this->attendance($request);
        $leave = $this->leave($request, false);

        $out = [
            'from_date' => $attendance['from_date'],
            'to_date' => $attendance['to_date'],
            'employees' => $workforce['totals'],
            'attendance' => $attendance['summary'],
            'absence' => [
                'absent' => $attendance['summary']['absent'],
                'pending_leave_days' => $attendance['summary']['pending_leave_days'],
            ],
            'leave' => $leave['summary'],
            'includes_payroll' => $withPayroll,
            'unavailable' => ['leave_entitlement' => self::UNAVAILABLE['leave_entitlement'], 'holidays' => self::UNAVAILABLE['holidays']],
        ];

        if ($withPayroll) {
            $from = Carbon::parse($attendance['from_date']);
            $to = Carbon::parse($attendance['to_date']);
            $out['payroll'] = $this->money(
                DB::table('payrolls')->join('employees', 'employees.id', '=', 'payrolls.employee_id')
                    ->whereNull('payrolls.deleted_at')->whereNull('employees.deleted_at')
                    ->whereRaw('(payrolls.payroll_year * 100 + payrolls.payroll_month) BETWEEN ? AND ?', [$from->year * 100 + $from->month, $to->year * 100 + $to->month])
                    ->when($request->filled('department_id'), fn ($q) => $q->where('employees.department_id', $request->integer('department_id')))
                    ->selectRaw(self::PAYROLL_SUMS)->first()
            );
        }

        return $out;
    }
}
