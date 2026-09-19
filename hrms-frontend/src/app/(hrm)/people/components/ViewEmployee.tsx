"use client";

import { formatDate } from "@/src/lib/date/format";
import { Button } from "@/src/components/ui/Button";
import { Drawer, DrawerContent } from "@/src/components/ui/drawer";
import { parseApiError } from "@/src/lib/api/errors";
import {
  employeeService,
  type EmployeeDetail,
} from "@/src/lib/employees/employee.service";
import {
  Briefcase,
  Building,
  Calendar,
  CheckCircle,
  FolderOpen,
  Hash,
  Mail,
  Phone,
  User,
  UserCircle,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState, type ComponentType, type ReactNode } from "react";

interface ViewEmployeeProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  employeeId: number | null;
}

type IconType = ComponentType<{ className?: string }>;

function InfoField({
  icon: Icon,
  label,
  value,
}: {
  icon?: IconType;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
        {Icon && <Icon className="h-4 w-4 text-muted" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="text-sm text-ink mt-0.5 wrap-break-word">{value || "-"}</p>
      </div>
    </div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border/80 p-6">{children}</div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon?: IconType;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="h-5 w-5 text-primary" />}
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
      </div>
      {description && <p className="text-sm text-muted ml-7">{description}</p>}
    </div>
  );
}

function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-8 last:mb-0">
      <h4 className="text-sm font-semibold text-ink mb-4 pb-2 border-b border-border/60">
        {title}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">{children}</div>
    </div>
  );
}

function NotAvailableNotice({ what }: { what: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-muted">
      {what} isn&apos;t returned by the employee profile API yet, so it can&apos;t be shown here.
    </div>
  );
}

const statusStyles: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Onboarding: "bg-blue-100 text-blue-700",
  Invited: "bg-amber-100 text-amber-700",
  Inactive: "bg-gray-100 text-gray-600",
  "On Leave": "bg-orange-100 text-orange-700",
  Terminated: "bg-red-100 text-red-700",
};

type TabId = "personal" | "employment" | "financial" | "documents" | "onboarding";

const TABS: { id: TabId; label: string; icon: IconType }[] = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "employment", label: "Employment", icon: Briefcase },
  { id: "financial", label: "Financial", icon: Wallet },
  { id: "documents", label: "Documents", icon: FolderOpen },
  { id: "onboarding", label: "Onboarding", icon: CheckCircle },
];

export function ViewEmployee({ isOpen, setIsOpen, employeeId }: ViewEmployeeProps) {
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadEmployee = useCallback(async () => {
    if (!isOpen || !employeeId) return;

    setIsLoading(true);
    setLoadError(null);
    setActiveTab("personal");

    try {
      setEmployee(await employeeService.show(employeeId));
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

  const name = employee ? `${employee.first_name} ${employee.last_name}`.trim() : "";

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen} swipeDirection="right" modal={true}>
      <DrawerContent
        title="Employee Profile"
        description="View employee information"
        onClose={() => setIsOpen(false)}
        className="min-w-200 max-w-225 w-225"
      >
        <div className="flex h-full min-h-0 flex-col bg-surface-muted">
          {isLoading && (
            <div className="flex flex-1 items-center justify-center">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-black/20 border-t-black" />
            </div>
          )}

          {!isLoading && loadError && (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-red-600">
              {loadError}
            </div>
          )}

          {!isLoading && employee && (
            <>
              <div className="shrink-0 bg-surface border-b border-border">
                <div className="h-24 bg-linear-to-r from-primary via-indigo-600 to-purple-600" />

                <div className="px-6 pb-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap -mt-10">
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 rounded-2xl bg-linear-to-br from-primary to-purple-600 flex items-center justify-center text-3xl font-semibold text-white shadow-lg ring-4 ring-surface shrink-0">
                        {name.charAt(0) || "?"}
                      </div>
                      <div className="pt-10">
                        <h2 className="text-2xl font-bold text-ink tracking-tight leading-tight">
                          {name}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-ink-soft">
                          <span>{employee.designation?.name || "—"}</span>
                          <span className="w-1 h-1 bg-muted rounded-full" />
                          <span>{employee.employment_type || "—"}</span>
                          <span className="w-1 h-1 bg-muted rounded-full" />
                          <span>{employee.work_mode || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    {employee.department && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-soft text-primary border border-primary/20">
                        {employee.department.name}
                      </span>
                    )}
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-ink-soft border border-border">
                      {employee.employee_code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[employee.employment_status] ?? "bg-gray-100 text-ink-soft"}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {employee.employment_status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 px-6 overflow-x-auto no-scrollbar">
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-2.5 text-md font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                          isActive
                            ? "border-primary text-primary"
                            : "border-transparent text-muted hover:text-ink"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === "personal" && (
                  <Panel>
                    <SectionHeader
                      icon={User}
                      title="Personal Information"
                      description="Basic personal details"
                    />

                    <InfoSection title="Personal Details">
                      <InfoField icon={UserCircle} label="First Name" value={employee.first_name} />
                      <InfoField icon={UserCircle} label="Last Name" value={employee.last_name} />
                      <InfoField icon={Mail} label="Email" value={employee.email} />
                      <InfoField icon={Phone} label="Phone Number" value={employee.phone} />
                      <InfoField icon={Calendar} label="Date of Birth" value={formatDate(employee.date_of_birth)} />
                      <InfoField icon={User} label="Gender" value={employee.gender} />
                      <InfoField icon={User} label="Marital Status" value={employee.marital_status} />
                      <InfoField icon={Phone} label="Alternate Phone" value={employee.alternate_phone} />
                    </InfoSection>

                    {employee.address && (
                      <InfoSection title="Address">
                        <InfoField icon={Hash} label="Address" value={employee.address} />
                      </InfoSection>
                    )}
                  </Panel>
                )}

                {activeTab === "employment" && (
                  <Panel>
                    <SectionHeader
                      icon={Briefcase}
                      title="Employment Information"
                      description="Job and department details"
                    />

                    <InfoSection title="Job Details">
                      <InfoField icon={Hash} label="Employee Code" value={employee.employee_code} />
                      <InfoField icon={Briefcase} label="Employment Type" value={employee.employment_type} />
                      <InfoField icon={Calendar} label="Joining Date" value={formatDate(employee.joining_date)} />
                      <InfoField
                        icon={Calendar}
                        label="Probation End Date"
                        value={formatDate(employee.probation_end_date)}
                      />
                      <InfoField icon={Building} label="Department" value={employee.department?.name} />
                      <InfoField icon={Briefcase} label="Designation" value={employee.designation?.name} />
                      <InfoField icon={Briefcase} label="Work Mode" value={employee.work_mode} />
                      <InfoField icon={Briefcase} label="Employment Level" value={employee.employment_level} />
                      <InfoField icon={Phone} label="Work Phone" value={employee.work_phone} />
                      <InfoField icon={User} label="Lifecycle" value={employee.lifecycle} />
                    </InfoSection>

                    {employee.user && (
                      <InfoSection title="Account">
                        <InfoField icon={Mail} label="Login Email" value={employee.user.email} />
                        <InfoField icon={User} label="Username" value={employee.user.username} />
                        <InfoField icon={Briefcase} label="Role" value={employee.user.role?.name} />
                        <InfoField
                          icon={CheckCircle}
                          label="Account Active"
                          value={employee.user.is_active ? "Yes" : "No"}
                        />
                      </InfoSection>
                    )}
                  </Panel>
                )}

                {activeTab === "financial" && (
                  <Panel>
                    <SectionHeader
                      icon={Wallet}
                      title="Financial Information"
                      description="Compensation, bank and payroll details"
                    />
                    <NotAvailableNotice what="Compensation and bank detail records" />
                  </Panel>
                )}

                {activeTab === "documents" && (
                  <Panel>
                    <SectionHeader
                      icon={FolderOpen}
                      title="Documents"
                      description="Employee identification and employment documents"
                    />
                    <NotAvailableNotice what="Document records" />
                  </Panel>
                )}

                {activeTab === "onboarding" && (
                  <Panel>
                    <SectionHeader
                      icon={CheckCircle}
                      title="Onboarding & Attendance"
                      description="Onboarding tasks, leave and attendance policies"
                    />
                    <NotAvailableNotice what="Onboarding and leave/attendance policy assignments" />
                  </Panel>
                )}
              </div>
            </>
          )}

          <div className="shrink-0 bg-surface border-t border-border px-6 py-4 flex justify-between items-center">
            <p className="text-xs text-muted">
              {employee ? `Employee Code: ${employee.employee_code}` : ""}
            </p>
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Close
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
