"use client";

import { Select } from "@/src/components/ui/Select";

const leavePolicies = [
  { label: "Standard Leave Policy", value: "standard_leave" },
  { label: "Flexible Leave Policy", value: "flexible_leave" },
  { label: "Unlimited Leave Policy", value: "unlimited_leave" },
];

const attendancePolicies = [
  { label: "Standard Attendance", value: "standard_attendance" },
  { label: "Biometric Attendance", value: "biometric_attendance" },
  { label: "Manual Attendance", value: "manual_attendance" },
  { label: "Location Based Attendance", value: "location_based_attendance" },
];

const workSchedules = [
  { label: "General Shift", value: "general_shift" },
  { label: "Morning Shift", value: "morning_shift" },
  { label: "Evening Shift", value: "evening_shift" },
  { label: "Night Shift", value: "night_shift" },
  { label: "Flexible Shift", value: "flexible_shift" },
];

const shifts = [
  { label: "General Shift", value: "general_shift" },
  { label: "Morning Shift", value: "morning_shift" },
  { label: "Evening Shift", value: "evening_shift" },
  { label: "Night Shift", value: "night_shift" },
  { label: "Rotational Shift", value: "rotational_shift" },
];

const weeklyOff = [
  { label: "Sunday", value: "sunday" },
  { label: "Monday", value: "monday" },
  { label: "Tuesday", value: "tuesday" },
  { label: "Wednesday", value: "wednesday" },
  { label: "Thursday", value: "thursday" },
  { label: "Friday", value: "friday" },
  { label: "Saturday", value: "saturday" },
];

const latePolicies = [
  { label: "No Late Policy", value: "no_late_policy" },
  { label: "Grace Period - 10 Minutes", value: "grace_10_minutes" },
  { label: "Grace Period - 15 Minutes", value: "grace_15_minutes" },
  { label: "Grace Period - 30 Minutes", value: "grace_30_minutes" },
];

const overtimePolicies = [
  { label: "No Overtime", value: "no_overtime" },
  { label: "Standard Overtime", value: "standard_overtime" },
  { label: "Paid Overtime", value: "paid_overtime" },
  { label: "Manager Approval Required", value: "manager_approval" },
];

export function LeaveAttendanceConfigurationStep() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="leavePolicy"
            className="text-sm font-medium text-gray-700"
          >
            Leave Policy
          </label>

          <Select
            id="leavePolicy"
            name="leavePolicy"
            placeholder="Select leave policy"
            options={leavePolicies}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="attendancePolicy"
            className="text-sm font-medium text-gray-700"
          >
            Attendance Policy
          </label>

          <Select
            id="attendancePolicy"
            name="attendancePolicy"
            placeholder="Select attendance policy"
            options={attendancePolicies}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="workSchedule"
            className="text-sm font-medium text-gray-700"
          >
            Work Schedule
          </label>

          <Select
            id="workSchedule"
            name="workSchedule"
            placeholder="Select work schedule"
            options={workSchedules}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label htmlFor="shift" className="text-sm font-medium text-gray-700">
            Shift
          </label>

          <Select
            id="shift"
            name="shift"
            placeholder="Select shift"
            options={shifts}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="weeklyOff"
            className="text-sm font-medium text-gray-700"
          >
            Weekly Off
          </label>

          <Select
            id="weeklyOff"
            name="weeklyOff"
            placeholder="Select weekly off"
            options={weeklyOff}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="latePolicy"
            className="text-sm font-medium text-gray-700"
          >
            Late Policy
          </label>

          <Select
            id="latePolicy"
            name="latePolicy"
            placeholder="Select late policy"
            options={latePolicies}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="overtimePolicy"
            className="text-sm font-medium text-gray-700"
          >
            Overtime Policy
          </label>

          <Select
            id="overtimePolicy"
            name="overtimePolicy"
            placeholder="Select overtime policy"
            options={overtimePolicies}
          />
        </div>
      </div>
    </div>
  );
}
