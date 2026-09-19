<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\AttendanceRegularization;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AttendanceRegularizationController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'attendance_date' => ['required', 'date'],
            'requested_check_in' => ['nullable', 'date'],
            'requested_check_out' => ['nullable', 'date', 'after_or_equal:requested_check_in'],
            'reason' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        if (!$validated['requested_check_in'] && !$validated['requested_check_out']) {
            throw ValidationException::withMessages([
                'requested_check_in' => ['Check-in or check-out time is required.'],
            ]);
        }

        $user = $request->user('api');

        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee) {
            abort(404, 'Employee profile not found.');
        }

        $existing = AttendanceRegularization::where('employee_id', $employee->id)
            ->whereDate('attendance_date', $validated['attendance_date'])
            ->where('status', 'Pending')
            ->exists();

        if ($existing) {
            throw ValidationException::withMessages([
                'attendance_date' => ['A pending regularization already exists for this date.'],
            ]);
        }

        $attendance = Attendance::where('employee_id', $employee->id)
            ->whereDate('attendance_date', $validated['attendance_date'])
            ->first();

        $regularization = AttendanceRegularization::create([
            'attendance_id' => $attendance?->id,
            'employee_id' => $employee->id,
            'attendance_date' => $validated['attendance_date'],
            'requested_check_in' => $validated['requested_check_in'] ?? null,
            'requested_check_out' => $validated['requested_check_out'] ?? null,
            'reason' => $validated['reason'],
            'description' => $validated['description'] ?? null,
            'status' => 'Pending',
            'requested_by' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Attendance regularization submitted successfully.',
            'data' => $regularization->load('attendance'),
        ], 201);
    }

    public function index(Request $request)
    {
        $user = $request->user('api');

        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee) {
            abort(404, 'Employee profile not found.');
        }

        $query = AttendanceRegularization::where('employee_id', $employee->id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $regularizations = $query->orderByDesc('created_at')->paginate(
            min((int) $request->get('per_page', 20), 100)
        );

        return response()->json([
            'success' => true,
            'data' => $regularizations,
        ]);
    }

    public function show(Request $request, AttendanceRegularization $attendanceRegularization)
    {
        // Same route/permission (`view attendance`) is shared with the
        // self-service index above, so this had no ownership check at all -
        // any employee could view any other employee's regularization
        // (reason/description) by id. Mirrors the ownership check cancel()
        // already does; HR/admins (edit attendance) can view any record.
        $user = $request->user('api');
        $employee = Employee::where('user_id', $user->id)->first();
        $isOwner = $employee && $attendanceRegularization->employee_id === $employee->id;

        if (!$isOwner && !$user->can('edit attendance')) {
            abort(403, 'You cannot view this regularization.');
        }

        $attendanceRegularization->load([
            'employee',
            'attendance',
            'requestedBy',
            'reviewedBy',
        ]);

        return response()->json([
            'success' => true,
            'data' => $attendanceRegularization,
        ]);
    }

    public function cancel(Request $request, AttendanceRegularization $attendanceRegularization)
    {
        $user = $request->user('api');

        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee || $attendanceRegularization->employee_id !== $employee->id) {
            abort(403, 'You cannot cancel this regularization.');
        }

        if ($attendanceRegularization->status !== 'Pending') {
            throw ValidationException::withMessages([
                'status' => ['Only pending regularizations can be cancelled.'],
            ]);
        }

        $attendanceRegularization->update([
            'status' => 'Cancelled',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Attendance regularization cancelled successfully.',
            'data' => $attendanceRegularization->fresh(),
        ]);
    }

    public function adminIndex(Request $request)
    {
        $query = AttendanceRegularization::with([
            'employee',
            'attendance',
            'requestedBy',
            'reviewedBy',
        ]);

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('from_date')) {
            $query->whereDate('attendance_date', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('attendance_date', '<=', $request->to_date);
        }

        $regularizations = $query->orderByDesc('created_at')->paginate(
            min((int) $request->get('per_page', 20), 100)
        );

        return response()->json([
            'success' => true,
            'data' => $regularizations,
        ]);
    }

    public function approve(Request $request, AttendanceRegularization $attendanceRegularization)
    {
        $validated = $request->validate([
            'reviewer_remarks' => ['nullable', 'string'],
        ]);

        if ($attendanceRegularization->status !== 'Pending') {
            throw ValidationException::withMessages([
                'status' => ['Only pending regularizations can be approved.'],
            ]);
        }

        return DB::transaction(function () use ($request, $validated, $attendanceRegularization) {
            $user = $request->user('api');

            $attendance = Attendance::firstOrCreate(
                [
                    'employee_id' => $attendanceRegularization->employee_id,
                    'attendance_date' => $attendanceRegularization->attendance_date,
                ],
                [
                    'status' => 'Present',
                    'source' => 'regularization',
                ]
            );

            $updateData = [
                'status' => 'Present',
                'source' => 'regularization',
            ];

            if ($attendanceRegularization->requested_check_in) {
                $updateData['check_in_at'] = $attendanceRegularization->requested_check_in;
            }

            if ($attendanceRegularization->requested_check_out) {
                $updateData['check_out_at'] = $attendanceRegularization->requested_check_out;
            }

            if ($attendanceRegularization->requested_check_in && $attendanceRegularization->requested_check_out) {
                $workSeconds = strtotime($attendanceRegularization->requested_check_out) - strtotime($attendanceRegularization->requested_check_in);
                $workHours = round($workSeconds / 3600, 2);
                $updateData['work_hours'] = $workHours;
                $updateData['overtime_hours'] = max(0, round($workHours - 8, 2));
            }

            $attendance->update($updateData);

            $attendanceRegularization->update([
                'attendance_id' => $attendance->id,
                'status' => 'Approved',
                'reviewed_by' => $user->id,
                'reviewed_at' => now(),
                'reviewer_remarks' => $validated['reviewer_remarks'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Attendance regularization approved successfully.',
                'data' => $attendanceRegularization->fresh()->load('attendance'),
            ]);
        });
    }

    public function reject(Request $request, AttendanceRegularization $attendanceRegularization)
    {
        $validated = $request->validate([
            'reviewer_remarks' => ['required', 'string'],
        ]);

        if ($attendanceRegularization->status !== 'Pending') {
            throw ValidationException::withMessages([
                'status' => ['Only pending regularizations can be rejected.'],
            ]);
        }

        $attendanceRegularization->update([
            'status' => 'Rejected',
            'reviewed_by' => $request->user('api')->id,
            'reviewed_at' => now(),
            'reviewer_remarks' => $validated['reviewer_remarks'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Attendance regularization rejected successfully.',
            'data' => $attendanceRegularization->fresh(),
        ]);
    }
}