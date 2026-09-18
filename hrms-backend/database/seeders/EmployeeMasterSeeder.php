<?php

namespace Database\Seeders;

use App\Models\AttendancePolicy;
use App\Models\LatePolicy;
use App\Models\LeavePolicy;
use App\Models\OnboardingChecklist;
use App\Models\OvertimePolicy;
use App\Models\Shift;
use App\Models\WeeklyOff;
use App\Models\WorkSchedule;
use Illuminate\Database\Seeder;

class EmployeeMasterSeeder extends Seeder
{
    public function run(): void
    {
        LeavePolicy::create(['name' => 'Standard Leave Policy', 'code' => 'LEAVE001', 'description' => 'Standard employee leave policy', 'is_active' => true]);

        AttendancePolicy::create(['name' => 'Standard Attendance Policy', 'code' => 'ATT001', 'description' => 'Standard attendance policy', 'is_active' => true]);

        WorkSchedule::create(['name' => 'General Work Schedule', 'code' => 'WS001', 'start_time' => '09:00', 'end_time' => '18:00', 'working_hours' => 8, 'description' => 'General office schedule', 'is_active' => true]);

        Shift::create(['name' => 'Morning Shift', 'code' => 'SHIFT001', 'start_time' => '09:00', 'end_time' => '18:00', 'working_hours' => 8, 'description' => 'Standard morning shift', 'is_active' => true]);

        WeeklyOff::create(['name' => 'Saturday Sunday', 'code' => 'WO001', 'days' => ['Saturday', 'Sunday'], 'description' => 'Saturday and Sunday weekly off', 'is_active' => true]);

        LatePolicy::create(['name' => 'Standard Late Policy', 'code' => 'LATE001', 'grace_minutes' => 15, 'max_late_minutes' => 120, 'description' => '15 minutes grace period', 'is_active' => true]);

        OvertimePolicy::create(['name' => 'Standard Overtime Policy', 'code' => 'OT001', 'minimum_hours' => 1, 'multiplier' => 1.5, 'description' => 'Standard overtime policy', 'is_active' => true]);

        OnboardingChecklist::create(['name' => 'Standard Employee Onboarding', 'code' => 'ONBOARD001', 'description' => 'Standard employee onboarding checklist', 'is_active' => true]);
    }
}