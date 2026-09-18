"use client";

import { Select } from "@/src/components/ui/Select";
import { Switch } from "@/src/components/ui/Switch";
import * as React from "react";
import { WeekDay, WorkingDaysConfig } from "../policy/page";

const ALL_DAYS: WeekDay[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DEPARTMENT_PRESETS: Record<string, WorkingDaysConfig> = {
  all: {
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    saturdayPolicy: "all-off",
  },
  IT: {
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    saturdayPolicy: "alternate-off",
  },
  HR: {
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    saturdayPolicy: "all-off",
  },
  FMCG: {
    workingDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    saturdayPolicy: "working",
  },
  BPO: {
    workingDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    saturdayPolicy: "working",
  },
};

const DEPARTMENT_OPTIONS = [
  { label: "All Departments", value: "all" },
  { label: "IT Department", value: "IT" },
  { label: "HR Department", value: "HR" },
  { label: "FMCG Department", value: "FMCG" },
  { label: "BPO Department", value: "BPO" },
];

const SATURDAY_PRESETS: {
  key: WorkingDaysConfig["saturdayPolicy"];
  label: string;
  description: string;
}[] = [
  {
    key: "all-off",
    label: "All Saturdays Off",
    description: "Every Saturday is a week off",
  },
  {
    key: "alternate-off",
    label: "Alternate Saturdays Off",
    description: "2nd & 4th Saturday of each month are off",
  },
  {
    key: "working",
    label: "Saturday Working",
    description: "Saturday is treated as a normal working day",
  },
];

export function WorkingDaysTab() {
  const [selectedDepartment, setSelectedDepartment] = React.useState("all");
  const [config, setConfig] = React.useState<WorkingDaysConfig>(
    DEPARTMENT_PRESETS["all"],
  );

  const handleDepartmentChange = (value: string | string[]) => {
    const dept = value as string;
    setSelectedDepartment(dept);
    setConfig(DEPARTMENT_PRESETS[dept] || DEPARTMENT_PRESETS["all"]);
  };

  const toggleDay = (day: WeekDay) => {
    setConfig((prev) => {
      const isWorking = prev.workingDays.includes(day);
      return {
        ...prev,
        workingDays: isWorking
          ? prev.workingDays.filter((d) => d !== day)
          : [...prev.workingDays, day],
      };
    });
  };

  const weekOffDays = ALL_DAYS.filter(
    (day) => !config.workingDays.includes(day),
  );

  // Get current saturday policy label
  const currentSaturdayPolicy = SATURDAY_PRESETS.find(
    (p) => p.key === config.saturdayPolicy,
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Weekly working days grid */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-border p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-ink">
              Weekly Working Days Schedule
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Toggle each day as a working day or a week off
            </p>
          </div>
          <div className="w-64">
            <Select
              label="Department"
              options={DEPARTMENT_OPTIONS}
              value={selectedDepartment}
              onChange={handleDepartmentChange}
              placeholder="Select department"
              clearable={false}
            />
          </div>
        </div>

        <div className="space-y-2">
          {ALL_DAYS.map((day) => {
            const isWorking = config.workingDays.includes(day);
            const isSaturday = day === "Saturday";

            return (
              <div
                key={day}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-colors duration-200 ${
                  isWorking
                    ? "border-emerald-200 bg-emerald-50/50"
                    : "border-border bg-gray-50"
                } ${isSaturday ? "border-dashed" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      isWorking
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {day.slice(0, 2)}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-ink">{day}</div>
                    <div className="text-xs text-muted">
                      {isWorking ? "Working Day" : "Week Off"}
                      {isSaturday && !isWorking && currentSaturdayPolicy && (
                        <span className="ml-1 text-emerald-600">
                          ({currentSaturdayPolicy.label})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={isWorking}
                  onChange={() => toggleDay(day)}
                  ariaLabel={`${day} working day toggle`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Saturday Policy Info */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-ink mb-4">Saturday Policy</h3>
        <div className="space-y-3">
          {SATURDAY_PRESETS.map((preset) => (
            <div
              key={preset.key}
              className={`p-3 rounded-lg border transition-colors ${
                config.saturdayPolicy === preset.key
                  ? "border-primary bg-primary-soft/10"
                  : "border-border"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    config.saturdayPolicy === preset.key
                      ? "border-primary bg-primary"
                      : "border-border"
                  }`}
                >
                  {config.saturdayPolicy === preset.key && (
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-ink">
                    {preset.label}
                  </div>
                  <div className="text-xs text-muted">{preset.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs text-muted">
            <span className="font-medium">Current Policy:</span>{" "}
            {currentSaturdayPolicy?.label || "Not set"}
          </div>
          <div className="text-xs text-muted mt-1">
            <span className="font-medium">Week Off Days:</span>{" "}
            {weekOffDays.length > 0 ? weekOffDays.join(", ") : "None"}
          </div>
        </div>
      </div>
    </div>
  );
}
