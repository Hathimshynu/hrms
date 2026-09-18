"use client";

import { Button } from "@/src/components/ui/Button";
import { Drawer, DrawerContent } from "@/src/components/ui/drawer";
import {
  Award,
  Briefcase,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileText,
  FolderOpen,
  Hash,
  Languages,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Shield,
  Trash2,
  User,
  UserCircle,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { memo, useState, type ComponentType, type ReactNode } from "react";

interface Person {
  id: string;
  name: string;
  avatar?: string;
  jobTitle: string;
  department: string;
  site: string;
  salary: number;
  joineddate: string;
  lifecycle: "Hired" | "Employed";
  status: "Active" | "Invited" | "Inactive";
}

interface ViewEmployeeProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  employee: Person | null;
}

type IconType = ComponentType<{ className?: string }>;

/* ---------- Small reusable building blocks ---------- */

function InfoField({
  icon: Icon,
  label,
  value,
}: {
  icon?: IconType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
        {Icon && <Icon className="h-4 w-4 text-muted" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
          {label}
        </p>
        <p className="text-sm text-ink mt-0.5 wrap-break-word">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border/80 p-6">
      {children}
    </div>
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

function InfoSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-8 last:mb-0">
      <h4 className="text-sm font-semibold text-ink mb-4 pb-2 border-b border-border/60">
        {title}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
        {children}
      </div>
    </div>
  );
}

const statusStyles: Record<string, string> = {
  Confirmed: "bg-green-100 text-green-700",
  Active: "bg-green-100 text-green-700",
  Invited: "bg-amber-100 text-amber-700",
  Inactive: "bg-gray-100 text-gray-600",
};

type TabId =
  | "personal"
  | "employment"
  | "financial"
  | "documents"
  | "onboarding";

const TABS: { id: TabId; label: string; icon: IconType }[] = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "employment", label: "Employment", icon: Briefcase },
  { id: "financial", label: "Financial", icon: Wallet },
  { id: "documents", label: "Documents", icon: FolderOpen },
  { id: "onboarding", label: "Onboarding", icon: CheckCircle },
];

export const ViewEmployee = memo(function ViewEmployee({
  isOpen,
  setIsOpen,
  employee,
}: ViewEmployeeProps) {
  const [activeTab, setActiveTab] = useState<TabId>("personal");

  const employeeData = {
    name: "Jai Saran",
    firstName: "Jai",
    lastName: "Saran",
    jobTitle: "Frontend Developer",
    employmentType: "Full-Time",
    workMode: "Remote",
    department: "Engineering",
    employeeId: "EMP-2023-089",
    status: "Confirmed",
    workEmail: "jai.saran@workforce.com",
    personalEmail: "jai.saran92@gmail.com",
    phone: "+91 98765 43210",
    alternatePhone: "+91 98765 43211",
    dateOfBirth: "15/08/1992",
    gender: "Male",
    maritalStatus: "Married",
    teamDepartment: "Engineering (Product)",
    designation: "Senior Frontend Developer",
    workLocation: "Bangalore, India",
    workModeDetailed: "Hybrid (3 Days Office)",
    shiftSchedule: "General Shift (10:00 AM - 07:00 PM)",
    employmentLevel: "L3 - Mid Level",
    reportingManager: "Priya Sharma",
    joiningDate: "15/03/2023",
    probationEndDate: "15/09/2023",
    workPhone: "+91 98765 43212",
    role: "Senior Frontend Developer",
    username: "jai.saran",
    accessLevel: "Level 3 - Full Access",

    currentAddress: {
      line1: "Apt 402, Skyline Towers",
      line2: "HSR Layout, Sector 2",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      postalCode: "560102",
    },
    permanentAddress: {
      line1: "123, Green Valley",
      line2: "Sector 15, Phase 2",
      city: "Gurugram",
      state: "Haryana",
      country: "India",
      postalCode: "122001",
    },

    emergencyContact: {
      name: "Sita Saran",
      phone: "+91 98765 43213",
      relationship: "Spouse",
      alternatePhone: "+91 98765 43214",
      address:
        "Apt 402, Skyline Towers, HSR Layout, Bangalore, Karnataka, 560102",
    },

    salaryType: "Monthly CTC",
    annualCTC: "₹24,00,000",
    basicSalary: "₹9,60,000",
    hra: "₹4,80,000",
    otherAllowances: "₹6,00,000",
    bonus: "₹3,60,000",
    payFrequency: "Monthly",
    effectiveFrom: "01/04/2023",

    bankName: "HDFC Bank Ltd.",
    accountHolderName: "Jai Saran",
    accountNumber: "XXXX-XXXX-5678",
    ifscCode: "HDFC0001234",
    accountType: "Savings",
    panNumber: "ABCDE1234F",
    uan: "123456789012",
    pfNumber: "KA/BLR/123456",

    documents: [
      { name: "Aadhaar Card.pdf", type: "Identity Proof", size: "1.2 MB" },
      { name: "Degree_Certificate.pdf", type: "Education", size: "2.4 MB" },
      { name: "Offer_Letter.pdf", type: "Employment", size: "856 KB" },
      { name: "PAN_Card.jpg", type: "Identity Proof", size: "456 KB" },
    ],

    highestQualification: "B.Tech - Computer Science",
    university: "Indian Institute of Technology",
    yearsOfExperience: "8 years",
    previousCompany: "Google India",
    languages: ["English (Fluent)", "Hindi (Native)", "Kannada (Intermediate)"],

    leavePolicy: "Standard Leave Policy (21 days)",
    workSchedule: "Monday to Friday",
    weeklyOff: "Saturday & Sunday",
    overtimePolicy: "OT approved on request",
    attendancePolicy: "Flexible Timings",
    shift: "Day Shift",
    latePolicy: "3 late arrivals allowed per month",

    onboardingStatus: "Completed",
    onboardingStartDate: "01/03/2023",
    onboardingChecklist: "Full Onboarding Checklist",
    assignedBuddy: "Rahul Verma",
    equipmentRequired: "MacBook Pro, 2x Monitors, Headset",
    hrNotes:
      "Completed all onboarding tasks successfully. Excellent performance during probation.",
  };

  const handleExport = () => console.log("Export employee data");
  const handleEdit = () => console.log("Edit employee");
  const handleDelete = () => console.log("Delete employee");

  return (
    <Drawer
      open={isOpen}
      onOpenChange={setIsOpen}
      swipeDirection="right"
      modal={true}
    >
      <DrawerContent
        title="Employee Profile"
        description="View complete employee information"
        onClose={() => setIsOpen(false)}
        className="min-w-200 max-w-225 w-225"
      >
        <div className="flex h-full min-h-0 flex-col bg-surface-muted">
          {employee && (
            <>
              <div className="shrink-0 bg-surface border-b border-border">
                <div className="h-24 bg-linear-to-r from-primary via-indigo-600 to-purple-600" />

                <div className="px-6 pb-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap -mt-10">
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 rounded-2xl bg-linear-to-br from-primary to-purple-600 flex items-center justify-center text-3xl font-semibold text-white shadow-lg ring-4 ring-surface shrink-0">
                        {employeeData.name.charAt(0)}
                      </div>
                      <div className="pt-10">
                        <h2 className="text-2xl font-bold text-ink tracking-tight leading-tight">
                          {employeeData.name}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-ink-soft">
                          <span>{employeeData.jobTitle}</span>
                          <span className="w-1 h-1 bg-muted rounded-full" />
                          <span>{employeeData.employmentType}</span>
                          <span className="w-1 h-1 bg-muted rounded-full" />
                          <span>{employeeData.workMode}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-10">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        className="flex h-12 cursor-pointer items-center gap-2 rounded-lg bg-[#FF7F50] px-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#E97451] hover:scale-105"
                      >
                        <Download className="h-4 w-4" />
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEdit}
                        className="flex h-10 sm:h-12 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-3.5 sm:px-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-dark hover:scale-105"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        className="flex h-10 sm:h-12 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-3.5 sm:px-4 text-sm font-semibold text-white transition-all duration-200 hover:scale-105"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-soft text-primary border border-primary/20">
                      {employeeData.department}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-ink-soft border border-border">
                      {employeeData.employeeId}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[employeeData.status] ?? "bg-gray-100 text-ink-soft"}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {employeeData.status}
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
                      <InfoField
                        icon={UserCircle}
                        label="First Name"
                        value={employeeData.firstName}
                      />
                      <InfoField
                        icon={UserCircle}
                        label="Last Name"
                        value={employeeData.lastName}
                      />
                      <InfoField
                        icon={Mail}
                        label="Email"
                        value={employeeData.personalEmail}
                      />
                      <InfoField
                        icon={Phone}
                        label="Phone Number"
                        value={employeeData.phone}
                      />
                      <InfoField
                        icon={Calendar}
                        label="Date of Birth"
                        value={employeeData.dateOfBirth}
                      />
                      <InfoField
                        icon={User}
                        label="Gender"
                        value={employeeData.gender}
                      />
                      <InfoField
                        icon={User}
                        label="Marital Status"
                        value={employeeData.maritalStatus}
                      />
                      <InfoField
                        icon={Phone}
                        label="Alternate Phone"
                        value={employeeData.alternatePhone}
                      />
                    </InfoSection>

                    <InfoSection title="Address">
                      <InfoField
                        icon={MapPin}
                        label="Current Address"
                        value={`${employeeData.currentAddress.line1}, ${employeeData.currentAddress.line2}, ${employeeData.currentAddress.city}, ${employeeData.currentAddress.state}, ${employeeData.currentAddress.country} - ${employeeData.currentAddress.postalCode}`}
                      />
                      <InfoField
                        icon={MapPin}
                        label="Permanent Address"
                        value={`${employeeData.permanentAddress.line1}, ${employeeData.permanentAddress.line2}, ${employeeData.permanentAddress.city}, ${employeeData.permanentAddress.state}, ${employeeData.permanentAddress.country} - ${employeeData.permanentAddress.postalCode}`}
                      />
                    </InfoSection>

                    <InfoSection title="Emergency Contact">
                      <InfoField
                        icon={User}
                        label="Contact Name"
                        value={employeeData.emergencyContact.name}
                      />
                      <InfoField
                        icon={Phone}
                        label="Phone Number"
                        value={employeeData.emergencyContact.phone}
                      />
                      <InfoField
                        icon={User}
                        label="Relationship"
                        value={employeeData.emergencyContact.relationship}
                      />
                      <InfoField
                        icon={Phone}
                        label="Alternate Phone"
                        value={employeeData.emergencyContact.alternatePhone}
                      />
                      <InfoField
                        icon={MapPin}
                        label="Address"
                        value={employeeData.emergencyContact.address}
                      />
                    </InfoSection>
                  </Panel>
                )}

                {activeTab === "employment" && (
                  <Panel>
                    <SectionHeader
                      icon={Briefcase}
                      title="Employment Information"
                      description="Job, department and work contact details"
                    />

                    <InfoSection title="Job Details">
                      <InfoField
                        icon={Hash}
                        label="Employee ID"
                        value={employeeData.employeeId}
                      />
                      <InfoField
                        icon={Briefcase}
                        label="Employment Type"
                        value={employeeData.employmentType}
                      />
                      <InfoField
                        icon={Calendar}
                        label="Joining Date"
                        value={employeeData.joiningDate}
                      />
                      <InfoField
                        icon={Calendar}
                        label="Probation End Date"
                        value={employeeData.probationEndDate}
                      />
                      <InfoField
                        icon={Building}
                        label="Department"
                        value={employeeData.teamDepartment}
                      />
                      <InfoField
                        icon={Briefcase}
                        label="Designation"
                        value={employeeData.designation}
                      />
                      <InfoField
                        icon={MapPin}
                        label="Work Location"
                        value={employeeData.workLocation}
                      />
                      <InfoField
                        icon={User}
                        label="Reporting Manager"
                        value={employeeData.reportingManager}
                      />
                      <InfoField
                        icon={Award}
                        label="Employment Level"
                        value={employeeData.employmentLevel}
                      />
                      <InfoField
                        icon={Briefcase}
                        label="Work Mode"
                        value={employeeData.workModeDetailed}
                      />
                      <InfoField
                        icon={Clock}
                        label="Shift Schedule"
                        value={employeeData.shiftSchedule}
                      />
                    </InfoSection>

                    <InfoSection title="Work Contact & Access">
                      <InfoField
                        icon={Mail}
                        label="Work Email"
                        value={employeeData.workEmail}
                      />
                      <InfoField
                        icon={Phone}
                        label="Work Phone"
                        value={employeeData.workPhone}
                      />
                      <InfoField
                        icon={User}
                        label="Username"
                        value={employeeData.username}
                      />
                      <InfoField
                        icon={Shield}
                        label="Access Level"
                        value={employeeData.accessLevel}
                      />
                    </InfoSection>

                    <InfoSection title="Skills & Qualifications">
                      <InfoField
                        icon={Award}
                        label="Highest Qualification"
                        value={employeeData.highestQualification}
                      />
                      <InfoField
                        icon={Building}
                        label="University"
                        value={employeeData.university}
                      />
                      <InfoField
                        icon={Clock}
                        label="Years of Experience"
                        value={employeeData.yearsOfExperience}
                      />
                      <InfoField
                        icon={Briefcase}
                        label="Previous Company"
                        value={employeeData.previousCompany}
                      />
                      <InfoField
                        icon={Languages}
                        label="Languages"
                        value={employeeData.languages.join(", ")}
                      />
                    </InfoSection>
                  </Panel>
                )}

                {activeTab === "financial" && (
                  <Panel>
                    <SectionHeader
                      icon={Wallet}
                      title="Financial Information"
                      description="Compensation, bank and payroll details"
                    />

                    <InfoSection title="Compensation">
                      <InfoField
                        icon={Wallet}
                        label="Salary Type"
                        value={employeeData.salaryType}
                      />
                      <InfoField
                        icon={Wallet}
                        label="Annual CTC"
                        value={employeeData.annualCTC}
                      />
                      <InfoField
                        icon={Wallet}
                        label="Basic Salary"
                        value={employeeData.basicSalary}
                      />
                      <InfoField
                        icon={Wallet}
                        label="HRA"
                        value={employeeData.hra}
                      />
                      <InfoField
                        icon={Wallet}
                        label="Other Allowances"
                        value={employeeData.otherAllowances}
                      />
                      <InfoField
                        icon={Wallet}
                        label="Bonus"
                        value={employeeData.bonus}
                      />
                      <InfoField
                        icon={Clock}
                        label="Pay Frequency"
                        value={employeeData.payFrequency}
                      />
                      <InfoField
                        icon={Calendar}
                        label="Effective From"
                        value={employeeData.effectiveFrom}
                      />
                    </InfoSection>

                    <InfoSection title="Bank & Payroll">
                      <InfoField
                        icon={Building}
                        label="Bank Name"
                        value={employeeData.bankName}
                      />
                      <InfoField
                        icon={User}
                        label="Account Holder"
                        value={employeeData.accountHolderName}
                      />
                      <InfoField
                        icon={Hash}
                        label="Account Number"
                        value={employeeData.accountNumber}
                      />
                      <InfoField
                        icon={Hash}
                        label="IFSC Code"
                        value={employeeData.ifscCode}
                      />
                      <InfoField
                        icon={Building}
                        label="Account Type"
                        value={employeeData.accountType}
                      />
                      <InfoField
                        icon={Hash}
                        label="PAN Number"
                        value={employeeData.panNumber}
                      />
                      <InfoField
                        icon={Hash}
                        label="UAN"
                        value={employeeData.uan}
                      />
                      <InfoField
                        icon={Hash}
                        label="PF Number"
                        value={employeeData.pfNumber}
                      />
                    </InfoSection>
                  </Panel>
                )}

                {activeTab === "documents" && (
                  <Panel>
                    <SectionHeader
                      icon={FolderOpen}
                      title="Documents"
                      description="Upload and manage employee documents"
                    />

                    <div className="mb-6 pb-2 border-b border-border/60">
                      <p className="text-sm font-medium text-ink mb-1">
                        Employee Documents
                      </p>
                      <p className="text-sm text-muted">
                        Upload and manage employee identification, employment
                        and educational documents.
                      </p>
                    </div>

                    {employeeData.documents.length > 0 ? (
                      <div className="space-y-3">
                        {employeeData.documents.map((doc, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3.5 bg-surface-muted rounded-xl border border-border hover:bg-gray-100/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary shrink-0">
                                <FileText className="h-4 w-4" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-ink truncate">
                                  {doc.name}
                                </p>
                                <p className="text-xs text-muted">
                                  {doc.type} • {doc.size}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:text-primary-dark shrink-0"
                            >
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-surface-muted rounded-xl border border-border">
                        <FolderOpen className="h-12 w-12 text-muted mx-auto mb-3" />
                        <p className="text-ink font-medium mb-1">
                          No documents added
                        </p>
                        <p className="text-sm text-muted">
                          Add the employee's identification and employment
                          documents.
                        </p>
                        <Button className="mt-4">
                          <FileText className="h-4 w-4 mr-2" />
                          Add Document
                        </Button>
                      </div>
                    )}
                  </Panel>
                )}

                {/* Onboarding Tab */}
                {activeTab === "onboarding" && (
                  <Panel>
                    <SectionHeader
                      icon={CheckCircle}
                      title="Onboarding & Attendance"
                      description="Onboarding tasks, leave and attendance policies"
                    />

                    <InfoSection title="Onboarding">
                      <InfoField
                        icon={CheckCircle}
                        label="Onboarding Status"
                        value={employeeData.onboardingStatus}
                      />
                      <InfoField
                        icon={Calendar}
                        label="Start Date"
                        value={employeeData.onboardingStartDate}
                      />
                      <InfoField
                        icon={FileText}
                        label="Checklist"
                        value={employeeData.onboardingChecklist}
                      />
                      <InfoField
                        icon={Users}
                        label="Assigned Buddy"
                        value={employeeData.assignedBuddy}
                      />
                      <InfoField
                        icon={Briefcase}
                        label="Equipment Required"
                        value={employeeData.equipmentRequired}
                      />
                      <InfoField
                        icon={FileText}
                        label="HR Notes"
                        value={employeeData.hrNotes}
                      />
                    </InfoSection>

                    <InfoSection title="Leave & Attendance">
                      <InfoField
                        icon={Clock}
                        label="Leave Policy"
                        value={employeeData.leavePolicy}
                      />
                      <InfoField
                        icon={Calendar}
                        label="Work Schedule"
                        value={employeeData.workSchedule}
                      />
                      <InfoField
                        icon={Calendar}
                        label="Weekly Off"
                        value={employeeData.weeklyOff}
                      />
                      <InfoField
                        icon={Clock}
                        label="Overtime Policy"
                        value={employeeData.overtimePolicy}
                      />
                      <InfoField
                        icon={Clock}
                        label="Attendance Policy"
                        value={employeeData.attendancePolicy}
                      />
                      <InfoField
                        icon={Clock}
                        label="Shift"
                        value={employeeData.shift}
                      />
                      <InfoField
                        icon={Clock}
                        label="Late Policy"
                        value={employeeData.latePolicy}
                      />
                    </InfoSection>
                  </Panel>
                )}
              </div>
            </>
          )}

          <div className="shrink-0 bg-surface border-t border-border px-6 py-4 flex justify-between items-center">
            <p className="text-xs text-muted">
              Employee ID: {employeeData.employeeId}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
});
