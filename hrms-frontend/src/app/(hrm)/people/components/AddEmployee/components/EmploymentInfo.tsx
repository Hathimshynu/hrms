"use client";

import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { departmentService, type DepartmentDto } from "@/src/lib/departments/department.service";
import { designationService, type DesignationDto } from "@/src/lib/designations/designation.service";
import {
  employeeMastersService,
  type BranchDto,
  type LocationDto,
  type ReportingManagerDto,
} from "@/src/lib/employees/employee-masters.service";
import { useEffect, useState } from "react";
import type { EmploymentValues, StepProps } from "../onboarding-form.types";

const employmentType = [
  { label: "Full Time", value: "Full Time" },
  { label: "Part Time", value: "Part Time" },
  { label: "Contract", value: "Contract" },
  { label: "Intern", value: "Intern" },
  { label: "Temporary", value: "Temporary" },
];

const employmentLevels = [
  { label: "Entry Level", value: "Entry Level" },
  { label: "Mid Level", value: "Mid Level" },
  { label: "Senior Level", value: "Senior Level" },
  { label: "Management", value: "Management" },
];

const workModes = [
  { label: "Office", value: "Office" },
  { label: "Remote", value: "Remote" },
  { label: "Hybrid", value: "Hybrid" },
];

export function EmployeeInfoStep({ values, onChange, errors }: StepProps<EmploymentValues>) {
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [designations, setDesignations] = useState<DesignationDto[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [managers, setManagers] = useState<ReportingManagerDto[]>([]);

  useEffect(() => {
    departmentService.list().then(setDepartments).catch(() => {});
    employeeMastersService.branches().then(setBranches).catch(() => {});
  }, []);

  useEffect(() => {
    const departmentId = values.department_id ? Number(values.department_id) : null;
    const designationsPromise = departmentId
      ? designationService.list({ department_id: departmentId })
      : Promise.resolve([]);
    const managersPromise = departmentId
      ? employeeMastersService.reportingManagers({ department_id: departmentId })
      : Promise.resolve([]);

    designationsPromise.then(setDesignations).catch(() => setDesignations([]));
    managersPromise.then(setManagers).catch(() => setManagers([]));
  }, [values.department_id]);

  useEffect(() => {
    const branchId = values.branch_id ? Number(values.branch_id) : null;
    const locationsPromise = branchId
      ? employeeMastersService.locations({ branch_id: branchId })
      : Promise.resolve([]);

    locationsPromise.then(setLocations).catch(() => setLocations([]));
  }, [values.branch_id]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label htmlFor="employmentType" className="text-sm font-medium text-gray-700">
            Employment Type
          </label>
          <Select
            id="employmentType"
            placeholder="Select employment type"
            options={employmentType}
            value={values.employment_type}
            clearable
            onChange={(v) => onChange({ employment_type: v as string })}
            error={errors.employment_type}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label htmlFor="joiningDate" className="text-sm font-medium text-gray-700">
            Joining Date
          </label>
          <Input
            id="joiningDate"
            type="date"
            value={values.joining_date}
            onChange={(e) => onChange({ joining_date: e.target.value })}
            error={errors.joining_date}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label htmlFor="probationEndDate" className="text-sm font-medium text-gray-700">
            Probation End Date
          </label>
          <Input
            id="probationEndDate"
            type="date"
            value={values.probation_end_date}
            onChange={(e) => onChange({ probation_end_date: e.target.value })}
            error={errors.probation_end_date}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label htmlFor="employmentLevel" className="text-sm font-medium text-gray-700">
            Employment Level
          </label>
          <Select
            id="employmentLevel"
            placeholder="Select employment level"
            options={employmentLevels}
            value={values.employment_level}
            clearable
            onChange={(v) => onChange({ employment_level: v as string })}
            error={errors.employment_level}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label htmlFor="department" className="text-sm font-medium text-gray-700">
            Department
          </label>
          <Select
            id="department"
            placeholder="Select department"
            options={departments.map((d) => ({ label: d.name, value: String(d.id) }))}
            value={values.department_id}
            clearable
            onChange={(v) =>
              onChange({ department_id: (v as string) || "", designation_id: "", reporting_manager_id: "" })
            }
            error={errors.department_id}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label htmlFor="designation" className="text-sm font-medium text-gray-700">
            Designation / Job Title
          </label>
          <Select
            id="designation"
            placeholder="Select designation"
            options={designations.map((d) => ({ label: d.name, value: String(d.id) }))}
            value={values.designation_id}
            clearable
            disabled={!values.department_id}
            onChange={(v) => onChange({ designation_id: v as string })}
            error={errors.designation_id}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label htmlFor="branch" className="text-sm font-medium text-gray-700">
            Branch
          </label>
          <Select
            id="branch"
            placeholder="Select branch"
            options={branches.map((b) => ({ label: b.name, value: String(b.id) }))}
            value={values.branch_id}
            clearable
            onChange={(v) => onChange({ branch_id: (v as string) || "", location_id: "" })}
            error={errors.branch_id}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label htmlFor="location" className="text-sm font-medium text-gray-700">
            Location
          </label>
          <Select
            id="location"
            placeholder="Select location"
            options={locations.map((l) => ({ label: l.name, value: String(l.id) }))}
            value={values.location_id}
            clearable
            disabled={!values.branch_id}
            onChange={(v) => onChange({ location_id: v as string })}
            error={errors.location_id}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label htmlFor="reportingManager" className="text-sm font-medium text-gray-700">
            Reporting Manager
          </label>
          <Select
            id="reportingManager"
            placeholder="Select reporting manager"
            options={managers.map((m) => ({ label: `${m.name} (${m.employee_code})`, value: String(m.id) }))}
            value={values.reporting_manager_id}
            clearable
            disabled={!values.department_id}
            onChange={(v) => onChange({ reporting_manager_id: v as string })}
            error={errors.reporting_manager_id}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label htmlFor="workMode" className="text-sm font-medium text-gray-700">
            Work Mode
          </label>
          <Select
            id="workMode"
            placeholder="Select work mode"
            options={workModes}
            value={values.work_mode}
            clearable
            onChange={(v) => onChange({ work_mode: v as string })}
            error={errors.work_mode}
          />
        </div>
      </div>
    </div>
  );
}
