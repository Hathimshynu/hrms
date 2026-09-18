<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\AttendanceEvent;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;
use Illuminate\Http\Exceptions\HttpResponseException;

class AttendanceController extends Controller
{
    public function today(Request $request)
    {
        $employee = $this->getEmployee($request);

        $attendance = Attendance::with('employee')
            ->where('employee_id', $employee->id)
            ->whereDate('attendance_date', now()->toDateString())
            ->first();

        return response()->json([
            'success' => true,
            'data' => $attendance ? $this->formatAttendance($attendance) : null,
        ]);
    }

    public function checkIn(Request $request)
    {
        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'accuracy' => ['nullable', 'numeric', 'min:0'],
            'device_id' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $employee = $this->getEmployee($request);

        if ($employee->employment_status !== 'Active') {
            throw ValidationException::withMessages([
                'attendance' => ['Employee is not active.'],
            ]);
        }

        if (!$employee->location_id) {
            throw ValidationException::withMessages([
                'location' => ['Employee location is not configured.'],
            ]);
        }

        $location = $employee->location;

        if (!$location) {
            throw ValidationException::withMessages([
                'location' => ['Employee location was not found.'],
            ]);
        }

        if ($location->latitude === null || $location->longitude === null) {
            throw ValidationException::withMessages([
                'location' => ['Location GPS coordinates are not configured.'],
            ]);
        }

        $today = now()->toDateString();

        $attendance = Attendance::where('employee_id', $employee->id)
            ->whereDate('attendance_date', $today)
            ->first();

        if ($attendance && $attendance->check_in_at) {
            throw ValidationException::withMessages([
                'check_in' => ['Employee has already checked in today.'],
            ]);
        }

        $distance = $this->calculateDistance(
            (float) $validated['latitude'],
            (float) $validated['longitude'],
            (float) $location->latitude,
            (float) $location->longitude
        );

        if ($distance > (int) $location->geofence_radius) {
            throw ValidationException::withMessages([
                'location' => ["You are outside the allowed attendance location. Distance: {$distance} meters."],
            ]);
        }

        return DB::transaction(function () use ($employee, $location, $validated, $distance, $today) {
            $checkInAt = now();

            $attendance = Attendance::updateOrCreate(
                [
                    'employee_id' => $employee->id,
                    'attendance_date' => $today,
                ],
                [
                    'check_in_at' => $checkInAt,
                    'check_in_latitude' => $validated['latitude'],
                    'check_in_longitude' => $validated['longitude'],
                    'check_in_accuracy' => $validated['accuracy'] ?? null,
                    'check_in_distance' => $distance,
                    'status' => 'Present',
                    'source' => 'mobile',
                    'device_id' => $validated['device_id'] ?? null,
                    'ip_address' => request()->ip(),
                    'notes' => $validated['notes'] ?? null,
                ]
            );

            AttendanceEvent::create([
                'attendance_id' => $attendance->id,
                'employee_id' => $employee->id,
                'event_type' => 'CHECK_IN',
                'event_at' => $checkInAt,
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
                'accuracy' => $validated['accuracy'] ?? null,
                'distance' => $distance,
                'source' => 'mobile',
                'device_id' => $validated['device_id'] ?? null,
                'ip_address' => request()->ip(),
                'notes' => $validated['notes'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Attendance check-in successful.',
                'data' => $this->formatAttendance($attendance->fresh()),
            ], 201);
        });
    }

    public function checkOut(Request $request)
    {
        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'accuracy' => ['nullable', 'numeric', 'min:0'],
            'device_id' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $employee = $this->getEmployee($request);

        if (!$employee->location_id) {
            throw ValidationException::withMessages([
                'location' => ['Employee location is not configured.'],
            ]);
        }

        $location = $employee->location;

        if (!$location || $location->latitude === null || $location->longitude === null) {
            throw ValidationException::withMessages([
                'location' => ['Location GPS coordinates are not configured.'],
            ]);
        }

        $today = now()->toDateString();

        $attendance = Attendance::where('employee_id', $employee->id)
            ->whereDate('attendance_date', $today)
            ->first();

        if (!$attendance || !$attendance->check_in_at) {
            throw ValidationException::withMessages([
                'check_out' => ['Employee has not checked in today.'],
            ]);
        }

        if ($attendance->check_out_at) {
            throw ValidationException::withMessages([
                'check_out' => ['Employee has already checked out today.'],
            ]);
        }

        $distance = $this->calculateDistance(
            (float) $validated['latitude'],
            (float) $validated['longitude'],
            (float) $location->latitude,
            (float) $location->longitude
        );

        if ($distance > (int) $location->geofence_radius) {
            throw ValidationException::withMessages([
                'location' => ["You are outside the allowed attendance location. Distance: {$distance} meters."],
            ]);
        }

        return DB::transaction(function () use ($employee, $attendance, $validated, $distance) {
            $checkOutAt = now();

            $workSeconds = $attendance->check_in_at->diffInSeconds($checkOutAt);
            $workHours = round($workSeconds / 3600, 2);

            $standardHours = 8;
            $overtimeHours = max(0, round($workHours - $standardHours, 2));

            $attendance->update([
                'check_out_at' => $checkOutAt,
                'check_out_latitude' => $validated['latitude'],
                'check_out_longitude' => $validated['longitude'],
                'check_out_accuracy' => $validated['accuracy'] ?? null,
                'check_out_distance' => $distance,
                'work_hours' => $workHours,
                'overtime_hours' => $overtimeHours,
                'source' => 'mobile',
                'device_id' => $validated['device_id'] ?? null,
                'ip_address' => request()->ip(),
                'notes' => $validated['notes'] ?? $attendance->notes,
            ]);

            AttendanceEvent::create([
                'attendance_id' => $attendance->id,
                'employee_id' => $employee->id,
                'event_type' => 'CHECK_OUT',
                'event_at' => $checkOutAt,
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
                'accuracy' => $validated['accuracy'] ?? null,
                'distance' => $distance,
                'source' => 'mobile',
                'device_id' => $validated['device_id'] ?? null,
                'ip_address' => request()->ip(),
                'notes' => $validated['notes'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Attendance check-out successful.',
                'data' => $this->formatAttendance($attendance->fresh()),
            ]);
        });
    }

    public function history(Request $request)
    {
        $employee = $this->getEmployee($request);

        $query = Attendance::where('employee_id', $employee->id);

        if ($request->filled('from_date')) {
            $query->whereDate('attendance_date', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('attendance_date', '<=', $request->to_date);
        }

        $attendances = $query->orderByDesc('attendance_date')->paginate(
            min((int) $request->get('per_page', 20), 100)
        );

        return response()->json([
            'success' => true,
            'data' => $attendances,
        ]);
    }

    public function calendar(Request $request)
    {
        $employee = $this->getEmployee($request);

        $month = $request->get('month', now()->format('Y-m'));

        $startDate = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $endDate = Carbon::createFromFormat('Y-m', $month)->endOfMonth();

        $attendances = Attendance::where('employee_id', $employee->id)
            ->whereBetween('attendance_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->orderBy('attendance_date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $attendances->map(fn($attendance) => $this->formatAttendance($attendance)),
        ]);
    }

    public function timesheet(Request $request)
    {
        $employee = $this->getEmployee($request);

        $month = $request->get('month', now()->format('Y-m'));

        $startDate = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $endDate = Carbon::createFromFormat('Y-m', $month)->endOfMonth();

        $attendances = Attendance::where('employee_id', $employee->id)
            ->whereBetween('attendance_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->orderBy('attendance_date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'month' => $month,
                'total_days' => $attendances->count(),
                'present_days' => $attendances->whereIn('status', ['Present', 'Late', 'Half Day'])->count(),
                'late_days' => $attendances->where('status', 'Late')->count(),
                'half_days' => $attendances->where('status', 'Half Day')->count(),
                'leave_days' => $attendances->where('status', 'On Leave')->count(),
                'total_work_hours' => round($attendances->sum('work_hours'), 2),
                'total_overtime_hours' => round($attendances->sum('overtime_hours'), 2),
                'records' => $attendances->map(fn($attendance) => $this->formatAttendance($attendance)),
            ],
        ]);
    }

    public function index(Request $request)
    {
        $query = Attendance::with(['employee.department', 'employee.designation', 'employee.branch', 'employee.location']);

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('attendance_date')) {
            $query->whereDate('attendance_date', $request->attendance_date);
        }

        if ($request->filled('from_date')) {
            $query->whereDate('attendance_date', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('attendance_date', '<=', $request->to_date);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $attendances = $query->orderByDesc('attendance_date')->paginate(
            min((int) $request->get('per_page', 20), 100)
        );

        return response()->json([
            'success' => true,
            'data' => $attendances,
        ]);
    }

    public function show(Attendance $attendance)
    {
        $attendance->load([
            'employee.department',
            'employee.designation',
            'employee.branch',
            'employee.location',
            'events',
            'regularizations',
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->formatAttendance($attendance),
        ]);
    }

    public function employeeAttendance(Employee $employee, Request $request)
    {
        $query = Attendance::where('employee_id', $employee->id);

        if ($request->filled('from_date')) {
            $query->whereDate('attendance_date', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('attendance_date', '<=', $request->to_date);
        }

        $attendances = $query->orderByDesc('attendance_date')->paginate(
            min((int) $request->get('per_page', 20), 100)
        );

        return response()->json([
            'success' => true,
            'data' => $attendances,
        ]);
    }

    public function summary(Request $request)
    {
        $date = $request->get('date', now()->toDateString());

        $query = Attendance::whereDate('attendance_date', $date);

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $date,
                'total_records' => (clone $query)->count(),
                'present' => (clone $query)->where('status', 'Present')->count(),
                'late' => (clone $query)->where('status', 'Late')->count(),
                'half_day' => (clone $query)->where('status', 'Half Day')->count(),
                'on_leave' => (clone $query)->where('status', 'On Leave')->count(),
                'absent' => (clone $query)->where('status', 'Absent')->count(),
                'holiday' => (clone $query)->where('status', 'Holiday')->count(),
                'week_off' => (clone $query)->where('status', 'Week Off')->count(),
            ],
        ]);
    }

    protected function getEmployee(Request $request): Employee
    {
        $user = $request->user('api');

        if (!$user) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Please login again.',
                'errors' => [
                    'authentication' => ['Authentication token is missing or invalid.'],
                ],
            ], 401));
        }

        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Employee profile is not linked to this user account.',
                'errors' => [
                    'employee' => ['No employee profile was found for the authenticated user. Please contact HR or administrator.'],
                ],
            ], 404));
        }

        if ($employee->employment_status !== 'Active') {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Employee account is not active.',
                'errors' => [
                    'employee' => ['Only active employees can access attendance.'],
                ],
            ], 403));
        }

        return $employee;
    }

    protected function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): int
    {
        $earthRadius = 6371000;

        $lat1 = deg2rad($lat1);
        $lat2 = deg2rad($lat2);
        $lon1 = deg2rad($lon1);
        $lon2 = deg2rad($lon2);

        $latDiff = $lat2 - $lat1;
        $lonDiff = $lon2 - $lon1;

        $a = sin($latDiff / 2) ** 2 + cos($lat1) * cos($lat2) * sin($lonDiff / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return (int) round($earthRadius * $c);
    }

    protected function formatAttendance(Attendance $attendance): array
    {
        return [
            'id' => $attendance->id,
            'employee_id' => $attendance->employee_id,
            'attendance_date' => $attendance->attendance_date?->format('Y-m-d'),
            'check_in_at' => $attendance->check_in_at?->format('Y-m-d H:i:s'),
            'check_out_at' => $attendance->check_out_at?->format('Y-m-d H:i:s'),
            'check_in' => [
                'latitude' => $attendance->check_in_latitude,
                'longitude' => $attendance->check_in_longitude,
                'accuracy' => $attendance->check_in_accuracy,
                'distance' => $attendance->check_in_distance,
            ],
            'check_out' => [
                'latitude' => $attendance->check_out_latitude,
                'longitude' => $attendance->check_out_longitude,
                'accuracy' => $attendance->check_out_accuracy,
                'distance' => $attendance->check_out_distance,
            ],
            'status' => $attendance->status,
            'work_hours' => $attendance->work_hours,
            'overtime_hours' => $attendance->overtime_hours,
            'source' => $attendance->source,
            'device_id' => $attendance->device_id,
            'notes' => $attendance->notes,
        ];
    }
}
