"use client";

import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";

const employmentType = [
  { label: "Full Time", value: "full_time" },
  { label: "Part Time", value: "part_time" },
  { label: "Contract", value: "contract" },
  { label: "Intern", value: "intern" },
  { label: "Temporary", value: "temporary" },
];

const departments = [
  { label: "IT", value: "it" },
  { label: "HR Department", value: "HR Department" },
  { label: "FMCG", value: "fmcg" }, 
];

const designations = [
  { label: "Software Engineer", value: "software_engineer" },
  { label: "Senior Software Engineer", value: "senior_software_engineer" },
  { label: "Team Lead", value: "team_lead" },
  { label: "Manager", value: "manager" },
];

const reportingManagers = [
  { label: "Select Manager", value: "select_manager" },
];

const workLocations = [
  { label: "Office", value: "office" },
  { label: "Remote", value: "remote" },
  { label: "Hybrid", value: "hybrid" },
];

const employmentLevels = [
  { label: "Entry Level", value: "entry_level" },
  { label: "Mid Level", value: "mid_level" },
  { label: "Senior Level", value: "senior_level" },
  { label: "Management", value: "management" },
];

const workModes = [
  { label: "On-site", value: "on_site" },
  { label: "Remote", value: "remote" },
  { label: "Hybrid", value: "hybrid" },
];

const workSchedules = [
  { label: "General Shift", value: "general_shift" },
  { label: "Morning Shift", value: "morning_shift" },
  { label: "Evening Shift", value: "evening_shift" },
  { label: "Night Shift", value: "night_shift" },
];

export function EmployeeInfoStep() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="employeeId"
            className="text-sm font-medium text-gray-700"
          >
            Employee ID
          </label>

          <Input
            id="employeeId"
            name="employeeId"
            placeholder="Enter employee ID"
          />
        </div>

 <div className="space-y-2 grid gap-px">
          <label
            htmlFor="employmentType"
            className="text-sm font-medium text-gray-700"
          >
            Employment Type
          </label>

          <Select
            id="employmentType"
            name="employmentType"
            placeholder="Select employment type"
            options={employmentType}
          />
        </div>


      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="probationEndDate"
            className="text-sm font-medium text-gray-700"
          >
            Probation End Date
          </label>

          <Input
            id="probationEndDate"
            name="probationEndDate"
            type="date"
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="joiningDate"
            className="text-sm font-medium text-gray-700"
          >
            Joining Date
          </label>

          <Input
            id="joiningDate"
            name="joiningDate"
            type="date"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="department"
            className="text-sm font-medium text-gray-700"
          >
            Department
          </label>

          <Select
            id="department"
            name="department"
            placeholder="Select department"
            options={departments}
          />
        </div>

 <div className="space-y-2 grid gap-px">
          <label
            htmlFor="designation"
            className="text-sm font-medium text-gray-700"
          >
            Designation / Job Title
          </label>

          <Select
            id="designation"
            name="designation"
            placeholder="Select designation"
            options={designations}
          />
        </div>

      </div>

      <div className="grid grid-cols-2 gap-4">
       
 <div className="space-y-2 grid gap-px">
          <label
            htmlFor="workLocation"
            className="text-sm font-medium text-gray-700"
          >
            Work Location
          </label>

          <Select
            id="workLocation"
            name="workLocation"
            placeholder="Select work location"
            options={workLocations}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="reportingManager"
            className="text-sm font-medium text-gray-700"
          >
            Reporting Manager
          </label>

          <Select
            id="reportingManager"
            name="reportingManager"
            placeholder="Select reporting manager"
            options={reportingManagers}
          />
        </div>
      </div>


      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="employmentLevel"
            className="text-sm font-medium text-gray-700"
          >
            Employment Level
          </label>

          <Select
            id="employmentLevel"
            name="employmentLevel"
            placeholder="Select employment level"
            options={employmentLevels}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="workMode"
            className="text-sm font-medium text-gray-700"
          >
            Work Mode
          </label>

          <Select
            id="workMode"
            name="workMode"
            placeholder="Select work mode"
            options={workModes}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="workSchedule"
            className="text-sm font-medium text-gray-700"
          >
            Shift / Work Schedule
          </label>

          <Select
            id="workSchedule"
            name="workSchedule"
            placeholder="Select work schedule"
            options={workSchedules}
          />
        </div>
      </div>
    </div>
  );
}