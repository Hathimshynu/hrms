"use client";

import { Select } from "@/src/components/ui/Select";
import { employeeMastersService, type MasterOption } from "@/src/lib/employees/employee-masters.service";
import { useEffect, useState } from "react";
import type { LeaveAttendanceValues, StepProps } from "../onboarding-form.types";

export function LeaveAttendanceConfigurationStep({
  values,
  onChange,
  errors,
}: StepProps<LeaveAttendanceValues>) {
  const [leavePolicies, setLeavePolicies] = useState<MasterOption[]>([]);
  const [attendancePolicies, setAttendancePolicies] = useState<MasterOption[]>([]);
  const [workSchedules, setWorkSchedules] = useState<MasterOption[]>([]);
  const [shifts, setShifts] = useState<MasterOption[]>([]);
  const [weeklyOffs, setWeeklyOffs] = useState<MasterOption[]>([]);
  const [latePolicies, setLatePolicies] = useState<MasterOption[]>([]);
  const [overtimePolicies, setOvertimePolicies] = useState<MasterOption[]>([]);

  useEffect(() => {
    employeeMastersService.leavePolicies().then(setLeavePolicies).catch(() => {});
    employeeMastersService.attendancePolicies().then(setAttendancePolicies).catch(() => {});
    employeeMastersService.workSchedules().then(setWorkSchedules).catch(() => {});
    employeeMastersService.shifts().then(setShifts).catch(() => {});
    employeeMastersService.weeklyOffs().then(setWeeklyOffs).catch(() => {});
    employeeMastersService.latePolicies().then(setLatePolicies).catch(() => {});
    employeeMastersService.overtimePolicies().then(setOvertimePolicies).catch(() => {});
  }, []);

  const opts = (list: MasterOption[]) => list.map((m) => ({ label: m.name, value: String(m.id) }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label className="text-sm font-medium text-gray-700">Leave Policy</label>
          <Select
            placeholder="Select leave policy"
            options={opts(leavePolicies)}
            value={values.leave_policy_id}
            clearable
            onChange={(v) => onChange({ leave_policy_id: v as string })}
            error={errors.leave_policy_id}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label className="text-sm font-medium text-gray-700">Attendance Policy</label>
          <Select
            placeholder="Select attendance policy"
            options={opts(attendancePolicies)}
            value={values.attendance_policy_id}
            clearable
            onChange={(v) => onChange({ attendance_policy_id: v as string })}
            error={errors.attendance_policy_id}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label className="text-sm font-medium text-gray-700">Work Schedule</label>
          <Select
            placeholder="Select work schedule"
            options={opts(workSchedules)}
            value={values.work_schedule_id}
            clearable
            onChange={(v) => onChange({ work_schedule_id: v as string })}
            error={errors.work_schedule_id}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label className="text-sm font-medium text-gray-700">Shift</label>
          <Select
            placeholder="Select shift"
            options={opts(shifts)}
            value={values.shift_id}
            clearable
            onChange={(v) => onChange({ shift_id: v as string })}
            error={errors.shift_id}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label className="text-sm font-medium text-gray-700">Weekly Off</label>
          <Select
            placeholder="Select weekly off"
            options={opts(weeklyOffs)}
            value={values.weekly_off_id}
            clearable
            onChange={(v) => onChange({ weekly_off_id: v as string })}
            error={errors.weekly_off_id}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label className="text-sm font-medium text-gray-700">Late Policy</label>
          <Select
            placeholder="Select late policy"
            options={opts(latePolicies)}
            value={values.late_policy_id}
            clearable
            onChange={(v) => onChange({ late_policy_id: v as string })}
            error={errors.late_policy_id}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label className="text-sm font-medium text-gray-700">Overtime Policy</label>
          <Select
            placeholder="Select overtime policy"
            options={opts(overtimePolicies)}
            value={values.overtime_policy_id}
            clearable
            onChange={(v) => onChange({ overtime_policy_id: v as string })}
            error={errors.overtime_policy_id}
          />
        </div>
      </div>
    </div>
  );
}
