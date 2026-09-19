"use client";

import { toDateInputValue } from "@/src/lib/date/format";
import { Button } from "@/src/components/ui/Button";
import { Drawer, DrawerContent } from "@/src/components/ui/drawer";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { parseApiError } from "@/src/lib/api/errors";
import { departmentService, type DepartmentDto } from "@/src/lib/departments/department.service";
import { designationService, type DesignationDto } from "@/src/lib/designations/designation.service";
import {
  employeeService,
  type EmployeeDetail,
  type UpdateEmployeePayload,
} from "@/src/lib/employees/employee.service";
import {
  employeeMastersService,
  type ReportingManagerDto,
} from "@/src/lib/employees/employee-masters.service";
import * as React from "react";
import { useEffect, useState } from "react";

interface EditEmployeeFormProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  employeeId: number | null;
  onSaved: () => void;
}

// Enum values verified against the employees table migration and
// UpdateEmployeeRequest (hrms-backend).
const GENDER_OPTIONS = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
  { label: "Prefer not to say", value: "Prefer not to say" },
];

const MARITAL_STATUS_OPTIONS = [
  { label: "Single", value: "Single" },
  { label: "Married", value: "Married" },
  { label: "Divorced", value: "Divorced" },
  { label: "Widowed", value: "Widowed" },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { label: "Full Time", value: "Full Time" },
  { label: "Part Time", value: "Part Time" },
  { label: "Contract", value: "Contract" },
  { label: "Intern", value: "Intern" },
  { label: "Temporary", value: "Temporary" },
];

const WORK_MODE_OPTIONS = [
  { label: "Office", value: "Office" },
  { label: "Remote", value: "Remote" },
  { label: "Hybrid", value: "Hybrid" },
];

const EMPLOYMENT_STATUS_OPTIONS = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
  { label: "Invited", value: "Invited" },
  { label: "On Leave", value: "On Leave" },
  { label: "Terminated", value: "Terminated" },
];

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  alternate_phone: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  employment_type: string;
  joining_date: string;
  probation_end_date: string;
  department_id: string;
  designation_id: string;
  reporting_manager_id: string;
  work_mode: string;
  employment_status: string;
};

const EMPTY_FORM: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  alternate_phone: "",
  date_of_birth: "",
  gender: "",
  marital_status: "",
  employment_type: "",
  joining_date: "",
  probation_end_date: "",
  department_id: "",
  designation_id: "",
  reporting_manager_id: "",
  work_mode: "",
  employment_status: "",
};

function toFormState(employee: EmployeeDetail): FormState {
  return {
    first_name: employee.first_name ?? "",
    last_name: employee.last_name ?? "",
    email: employee.email ?? "",
    phone: employee.phone ?? "",
    alternate_phone: employee.alternate_phone ?? "",
    date_of_birth: toDateInputValue(employee.date_of_birth),
    gender: employee.gender ?? "",
    marital_status: employee.marital_status ?? "",
    employment_type: employee.employment_type ?? "",
    joining_date: toDateInputValue(employee.joining_date),
    probation_end_date: toDateInputValue(employee.probation_end_date),
    department_id: employee.department_id ? String(employee.department_id) : "",
    designation_id: employee.designation_id ? String(employee.designation_id) : "",
    reporting_manager_id: employee.reporting_manager_id
      ? String(employee.reporting_manager_id)
      : "",
    work_mode: employee.work_mode ?? "",
    employment_status: employee.employment_status ?? "",
  };
}

export function EditEmployeeForm({
  isOpen,
  setIsOpen,
  employeeId,
  onSaved,
}: EditEmployeeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [designations, setDesignations] = useState<DesignationDto[]>([]);
  const [managers, setManagers] = useState<ReportingManagerDto[]>([]);

  const loadEmployee = React.useCallback(async () => {
    if (!isOpen || !employeeId) return;

    setIsLoading(true);
    setLoadError(null);
    setErrors({});
    setFormError(null);

    try {
      const [employee, departmentList] = await Promise.all([
        employeeService.show(employeeId),
        departmentService.list(),
      ]);
      setFormData(toFormState(employee));
      setDepartments(departmentList);
      if (employee.department_id) {
        setDesignations(await designationService.list({ department_id: employee.department_id }));
      }
    } catch (err) {
      setLoadError(parseApiError(err, "Failed to load employee.").message);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, employeeId]);

  // Loading employee data when the drawer opens for a given id is a
  // genuine effect, not derivable during render - same loader pattern
  // used by the Departments/Designations/People list pages.
  useEffect(() => {
    loadEmployee(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [loadEmployee]);

  useEffect(() => {
    const departmentId = formData.department_id ? Number(formData.department_id) : null;
    const managersPromise = departmentId
      ? employeeMastersService.reportingManagers({ department_id: departmentId })
      : Promise.resolve([]);

    managersPromise.then(setManagers).catch(() => setManagers([]));
  }, [formData.department_id]);

  const handleChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleDepartmentChange = (value: string) => {
    handleChange("department_id", value);
    handleChange("designation_id", "");
    if (value) {
      designationService.list({ department_id: Number(value) }).then(setDesignations);
    } else {
      setDesignations([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || isSaving) return;

    setFormError(null);
    setErrors({});

    const payload: UpdateEmployeePayload = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || null,
      alternate_phone: formData.alternate_phone.trim() || null,
      date_of_birth: formData.date_of_birth || null,
      gender: formData.gender || null,
      marital_status: formData.marital_status || null,
      employment_type: formData.employment_type || undefined,
      joining_date: formData.joining_date || null,
      probation_end_date: formData.probation_end_date || null,
      department_id: formData.department_id ? Number(formData.department_id) : null,
      designation_id: formData.designation_id ? Number(formData.designation_id) : null,
      reporting_manager_id: formData.reporting_manager_id
        ? Number(formData.reporting_manager_id)
        : null,
      work_mode: formData.work_mode || null,
      employment_status: formData.employment_status || undefined,
    };

    setIsSaving(true);
    try {
      await employeeService.update(employeeId, payload);
      setIsOpen(false);
      onSaved();
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err, "Failed to update employee.");
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      } else {
        setFormError(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const departmentOptions = departments.map((d) => ({ label: d.name, value: String(d.id) }));
  const designationOptions = designations.map((d) => ({ label: d.name, value: String(d.id) }));
  const managerOptions = managers.map((m) => ({
    label: `${m.name} (${m.employee_code})`,
    value: String(m.id),
  }));

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen} swipeDirection="right" modal={true}>
      <DrawerContent
        title="Edit Employee"
        description="Update employee information"
        onClose={() => setIsOpen(false)}
        className="min-w-1xl"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading && (
              <div className="flex justify-center py-12">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-black/20 border-t-black" />
              </div>
            )}

            {!isLoading && loadError && (
              <div className="rounded-xl border border-red-500/25 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {loadError}
              </div>
            )}

            {!isLoading && !loadError && (
              <form id="edit-employee-form" onSubmit={handleSubmit} className="space-y-6">
                {formError && (
                  <div className="rounded-xl border border-red-500/25 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={formData.first_name}
                    onChange={(e) => handleChange("first_name", e.target.value)}
                    error={errors.first_name}
                  />
                  <Input
                    label="Last Name"
                    value={formData.last_name}
                    onChange={(e) => handleChange("last_name", e.target.value)}
                    error={errors.last_name}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    error={errors.email}
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    error={errors.phone}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Alternate Phone"
                    type="tel"
                    value={formData.alternate_phone}
                    onChange={(e) => handleChange("alternate_phone", e.target.value)}
                    error={errors.alternate_phone}
                  />
                  <Input
                    label="Date of Birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleChange("date_of_birth", e.target.value)}
                    error={errors.date_of_birth}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Gender"
                    placeholder="Select gender"
                    options={GENDER_OPTIONS}
                    value={formData.gender}
                    clearable
                    onChange={(v) => handleChange("gender", v as string)}
                    error={errors.gender}
                  />
                  <Select
                    label="Marital Status"
                    placeholder="Select marital status"
                    options={MARITAL_STATUS_OPTIONS}
                    value={formData.marital_status}
                    clearable
                    onChange={(v) => handleChange("marital_status", v as string)}
                    error={errors.marital_status}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Employment Type"
                    placeholder="Select employment type"
                    options={EMPLOYMENT_TYPE_OPTIONS}
                    value={formData.employment_type}
                    clearable
                    onChange={(v) => handleChange("employment_type", v as string)}
                    error={errors.employment_type}
                  />
                  <Select
                    label="Work Mode"
                    placeholder="Select work mode"
                    options={WORK_MODE_OPTIONS}
                    value={formData.work_mode}
                    clearable
                    onChange={(v) => handleChange("work_mode", v as string)}
                    error={errors.work_mode}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Joining Date"
                    type="date"
                    value={formData.joining_date}
                    onChange={(e) => handleChange("joining_date", e.target.value)}
                    error={errors.joining_date}
                  />
                  <Input
                    label="Probation End Date"
                    type="date"
                    value={formData.probation_end_date}
                    onChange={(e) => handleChange("probation_end_date", e.target.value)}
                    error={errors.probation_end_date}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Department"
                    placeholder="Select department"
                    options={departmentOptions}
                    value={formData.department_id}
                    clearable
                    onChange={(v) => handleDepartmentChange((v as string) || "")}
                    error={errors.department_id}
                  />
                  <Select
                    label="Designation"
                    placeholder="Select designation"
                    options={designationOptions}
                    value={formData.designation_id}
                    clearable
                    disabled={!formData.department_id}
                    onChange={(v) => handleChange("designation_id", v as string)}
                    error={errors.designation_id}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Reporting Manager"
                    placeholder="Select reporting manager"
                    options={managerOptions}
                    value={formData.reporting_manager_id}
                    clearable
                    onChange={(v) => handleChange("reporting_manager_id", v as string)}
                    error={errors.reporting_manager_id}
                  />
                  <Select
                    label="Employment Status"
                    placeholder="Select status"
                    options={EMPLOYMENT_STATUS_OPTIONS}
                    value={formData.employment_status}
                    clearable
                    onChange={(v) => handleChange("employment_status", v as string)}
                    error={errors.employment_status}
                  />
                </div>
              </form>
            )}
          </div>

          <div className="shrink-0 rounded-bl-lg border-t bg-white px-6 py-4">
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" form="edit-employee-form" isLoading={isSaving} disabled={isLoading}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
