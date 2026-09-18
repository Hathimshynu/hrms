"use client";

import { Button } from "@/src/components/ui/Button";
import { Drawer, DrawerContent } from "@/src/components/ui/drawer";
import { Step, Stepper } from "@/src/components/ui/stepper";
import { useState } from "react";
import { AddressDetailsStep } from "./components/AddressDetailsStep";
import { BankPayrollStep } from "./components/BankPayrollStep";
import { CompensationStep } from "./components/CompensationStep";
import { DocumentsStep } from "./components/DocumentsStep";
import { EmergencyContactStep } from "./components/EmergencyContactStep";
import { EmployeeInfoStep } from "./components/EmploymentInfo";
import { LeaveAttendanceConfigurationStep } from "./components/LeaveAttendanceStep";
import { OnboardingStep } from "./components/OnboardingStep";
import { PersonalInfoStep } from "./components/PersonalInfo";
import { SkillsProfessionalInfoStep } from "./components/SkillsProfessionalInfoStep";
import { WorkContactAccountStep } from "./components/WorkContactAccountStep";

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

interface AddEmployeeProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  editingEmployee?: Person | null;
  onSave: (employee: any) => void;
}

const STEPS: Step[] = [
  {
    id: "personal",
    title: "Personal Information",
    description: "Basic personal details",
  },
  {
    id: "employment",
    title: "Employment Information",
    description: "Job and department details",
  },
  {
    id: "work-contact",
    title: "Work Contact & Account",
    description: "Work email and access", 
  },
  {
    id: "address",
    title: "Address",
    description: "Current address details",
  },
  {
    id: "emergency",
    title: "Emergency Contact",
    description: "Emergency contact person",
  },
  {
    id: "compensation",
    title: "Compensation",
    description: "Salary and benefits",
  },
  {
    id: "bank-payroll",
    title: "Bank & Payroll",
    description: "Payment details",
  },
  {
    id: "documents",
    title: "Documents",
    description: "Upload required documents",
  },
  {
    id: "skills",
    title: "Skills & Professional Info",
    description: "Skills and certifications",
  },
  {
    id: "leave-attendance",
    title: "Leave & Attendance",
    description: "Leave policies and attendance",
  },
  {
    id: "onboarding",
    title: "Onboarding",
    description: "Onboarding tasks and completion",
  },
];

export function AddEmployee({
  isOpen,
  setIsOpen,
  editingEmployee,
  onSave,
}: AddEmployeeProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({});

  const handleNext = () => {
    if (activeStep < STEPS.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handlePrevious = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSave = () => {
    onSave(formData);
    setIsOpen(false);
    setActiveStep(0);
  };

  const renderStepContent = () => {
    const currentStep = STEPS[activeStep];

    switch (activeStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="text-xl font-semibold">{currentStep.title}</h3>
              <p className="text-sm text-muted-foreground">
                {currentStep.description}
              </p>
            </div>
            <PersonalInfoStep />
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="text-2xl font-semibold">{currentStep.title}</h3>
              <p className="text-sm text-muted-foreground">
                {currentStep.description}
              </p>
            </div>
            <EmployeeInfoStep />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="text-2xl font-semibold">{currentStep.title}</h3>
              <p className="text-sm text-muted-foreground">
                {currentStep.description}
              </p>
            </div>
            <WorkContactAccountStep />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="text-2xl font-semibold">{currentStep.title}</h3>
              <p className="text-sm text-muted-foreground">
                {currentStep.description}
              </p>
            </div>
            <AddressDetailsStep />
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="text-2xl font-semibold">{currentStep.title}</h3>
              <p className="text-sm text-muted-foreground">
                {currentStep.description}
              </p>
            </div>
            <EmergencyContactStep />
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="text-2xl font-semibold">{currentStep.title}</h3>
              <p className="text-sm text-muted-foreground">
                {currentStep.description}
              </p>
            </div>
            <CompensationStep />
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="text-2xl font-semibold">{currentStep.title}</h3>
              <p className="text-sm text-muted-foreground">
                {currentStep.description}
              </p>
            </div>
            <BankPayrollStep />
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="text-2xl font-semibold">{currentStep.title}</h3>
              <p className="text-sm text-muted-foreground">
                {currentStep.description}
              </p>
            </div>
            <DocumentsStep />
          </div>
        );

      case 8:
        return (
          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="text-2xl font-semibold">{currentStep.title}</h3>
              <p className="text-sm text-muted-foreground">
                {currentStep.description}
              </p>
            </div>
            <SkillsProfessionalInfoStep />
          </div>
        );

      case 9:
        return (
          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="text-2xl font-semibold">{currentStep.title}</h3>
              <p className="text-sm text-muted-foreground">
                {currentStep.description}
              </p>
            </div>
            <LeaveAttendanceConfigurationStep />
          </div>
        );

      case 10:
        return (
          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="text-2xl font-semibold">{currentStep.title}</h3>
              <p className="text-sm text-muted-foreground">
                {currentStep.description}
              </p>
            </div>
            <OnboardingStep />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Drawer
      open={isOpen}
      onOpenChange={setIsOpen}
      swipeDirection="right"
      modal={true}
    >
      <DrawerContent
        title={editingEmployee ? "Edit Employee" : "Add New Employee"}
        description={
          editingEmployee
            ? "Update employee information"
            : "Fill in the details to add a new employee"
        }
        onClose={() => setIsOpen(false)}
        className="min-w-1xl"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            <Stepper
              steps={STEPS}
              activeStep={activeStep}
              onStepChange={setActiveStep}
              orientation="horizontal"
            >
              <div className="mt-6 min-h-75">{renderStepContent()}</div>
            </Stepper>
          </div>

          <div className="shrink-0 rounded-bl-lg border-t bg-white px-6 py-4">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={activeStep === 0}
              >
                Previous
              </Button>

              {activeStep === STEPS.length - 1 ? (
                <Button onClick={handleSave}>
                  {editingEmployee ? "Update Employee" : "Add Employee"}
                </Button>
              ) : (
                <Button onClick={handleNext}>Next Step</Button>
              )}

              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="hover:bg-red-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
