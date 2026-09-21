<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\AttendanceRegularization;
use App\Models\Employee;
use App\Models\User;
use App\Support\Export\TabularExport;
use Illuminate\Http\Request;

/**
 * Server-side exports for lists owned by existing controllers. Each method
 * mirrors the filter set of its list endpoint (named in the docblock) and is
 * mounted behind the SAME permission middleware, so an export can never see
 * more than the list. They stream/iterate the whole filtered dataset, never
 * just the visible page. Only non-sensitive columns are exported: no password
 * data, no bank details, no salary.
 *
 * Employees, leaves, absence and payroll exports live next to their list
 * code (EmployeeController, LeaveController, AbsenceController,
 * PayrollController) because they share a private filter builder there.
 */
class ExportController extends Controller
{
    /** Mirrors UserController@index (search, role_id, is_active). `view users`. */
    public function users(Request $request)
    {
        $query = User::query()->with(['role:id,name', 'employee:id,user_id,employee_code'])->latest();

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(fn ($inner) => $inner->where('name', 'like', '%'.$search.'%')->orWhere('email', 'like', '%'.$search.'%'));
        }

        if ($request->filled('role_id')) {
            $query->where('role_id', $request->integer('role_id'));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $rows = (function () use ($query) {
            foreach ($query->cursor() as $u) {
                yield [
                    $u->name,
                    $u->email,
                    $u->role?->name,
                    $u->employee?->employee_code,
                    $u->is_active ? 'Active' : 'Inactive',
                    TabularExport::dateTime($u->last_login_at),
                    TabularExport::dateTime($u->created_at),
                ];
            }
        })();

        return TabularExport::download(
            'users-'.now()->format('Y-m-d'),
            ['Name', 'Email', 'Role', 'Employee Code', 'Status', 'Last Login', 'Created At'],
            $rows,
            $request->string('format', 'csv')->toString(),
        );
    }

    /** Mirrors AttendanceController@index (employee_id, attendance_date, from/to_date, status). `edit attendance`. */
    public function attendance(Request $request)
    {
        $query = Attendance::with(['employee:id,employee_code,first_name,last_name,department_id', 'employee.department:id,name'])
            ->orderByDesc('attendance_date');

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->integer('employee_id'));
        }

        if ($request->filled('attendance_date')) {
            $query->whereDate('attendance_date', $request->string('attendance_date')->toString());
        }

        if ($request->filled('from_date')) {
            $query->whereDate('attendance_date', '>=', $request->string('from_date')->toString());
        }

        if ($request->filled('to_date')) {
            $query->whereDate('attendance_date', '<=', $request->string('to_date')->toString());
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $rows = (function () use ($query) {
            foreach ($query->cursor() as $a) {
                yield [
                    $a->employee?->employee_code,
                    trim(($a->employee?->first_name ?? '').' '.($a->employee?->last_name ?? '')),
                    $a->employee?->department?->name,
                    TabularExport::date($a->attendance_date),
                    TabularExport::time($a->check_in_at),
                    TabularExport::time($a->check_out_at),
                    $a->work_hours !== null ? (float) $a->work_hours : null,
                    $a->overtime_hours !== null ? (float) $a->overtime_hours : null,
                    $a->status,
                ];
            }
        })();

        return TabularExport::download(
            'attendance-'.($request->filled('attendance_date') ? $request->string('attendance_date')->toString() : ($request->filled('from_date') ? $request->string('from_date')->toString().'-to-'.$request->string('to_date', now()->format('Y-m-d'))->toString() : now()->format('Y-m-d'))),
            ['Employee Code', 'Employee', 'Department', 'Date', 'Check In', 'Check Out', 'Work Hours', 'Overtime Hours', 'Status'],
            $rows,
            $request->string('format', 'csv')->toString(),
        );
    }

    /** Mirrors AttendanceController@history: the caller's OWN records only. `view attendance`. */
    public function myAttendance(Request $request)
    {
        $employee = $this->employee($request);
        $query = Attendance::where('employee_id', $employee->id)->orderByDesc('attendance_date');

        if ($request->filled('from_date')) {
            $query->whereDate('attendance_date', '>=', $request->string('from_date')->toString());
        }

        if ($request->filled('to_date')) {
            $query->whereDate('attendance_date', '<=', $request->string('to_date')->toString());
        }

        $rows = (function () use ($query) {
            foreach ($query->cursor() as $a) {
                yield [
                    TabularExport::date($a->attendance_date),
                    TabularExport::time($a->check_in_at),
                    TabularExport::time($a->check_out_at),
                    $a->work_hours !== null ? (float) $a->work_hours : null,
                    $a->overtime_hours !== null ? (float) $a->overtime_hours : null,
                    $a->status,
                ];
            }
        })();

        return TabularExport::download(
            'my-attendance-'.now()->format('Y-m-d'),
            ['Date', 'Check In', 'Check Out', 'Work Hours', 'Overtime Hours', 'Status'],
            $rows,
            $request->string('format', 'csv')->toString(),
        );
    }

    /** Mirrors AttendanceRegularizationController@adminIndex. `edit attendance`. */
    public function regularizationsAdmin(Request $request)
    {
        $query = AttendanceRegularization::with(['employee:id,employee_code,first_name,last_name', 'reviewedBy:id,name'])
            ->orderByDesc('created_at');

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->integer('employee_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('from_date')) {
            $query->whereDate('attendance_date', '>=', $request->string('from_date')->toString());
        }

        if ($request->filled('to_date')) {
            $query->whereDate('attendance_date', '<=', $request->string('to_date')->toString());
        }

        return $this->regularizations($query, 'regularizations', $request, true);
    }

    /** Mirrors AttendanceRegularizationController@index: the caller's OWN requests only. `view attendance`. */
    public function myRegularizations(Request $request)
    {
        $employee = $this->employee($request);
        $query = AttendanceRegularization::with('reviewedBy:id,name')->where('employee_id', $employee->id)->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        return $this->regularizations($query, 'my-regularizations', $request, false);
    }

    private function regularizations($query, string $name, Request $request, bool $withEmployee)
    {
        $rows = (function () use ($query, $withEmployee) {
            foreach ($query->cursor() as $r) {
                $row = $withEmployee
                    ? [$r->employee?->employee_code, trim(($r->employee?->first_name ?? '').' '.($r->employee?->last_name ?? ''))]
                    : [];

                yield array_merge($row, [
                    TabularExport::date($r->attendance_date),
                    TabularExport::dateTime($r->requested_check_in),
                    TabularExport::dateTime($r->requested_check_out),
                    $r->reason,
                    $r->status,
                    $r->reviewer_remarks,
                    $r->reviewedBy?->name,
                    TabularExport::dateTime($r->reviewed_at),
                    TabularExport::dateTime($r->created_at),
                ]);
            }
        })();

        $headings = array_merge(
            $withEmployee ? ['Employee Code', 'Employee'] : [],
            ['Attendance Date', 'Requested Check In', 'Requested Check Out', 'Reason', 'Status', 'Reviewer Remarks', 'Reviewed By', 'Reviewed At', 'Requested At'],
        );

        return TabularExport::download($name.'-'.now()->format('Y-m-d'), $headings, $rows, $request->string('format', 'csv')->toString());
    }

    private function employee(Request $request): Employee
    {
        $employee = Employee::where('user_id', $request->user('api')->id)->first();

        if (! $employee) {
            abort(404, 'Employee profile not found.');
        }

        return $employee;
    }
}
