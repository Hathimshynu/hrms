// components/ui/stepper.tsx
"use client";

import { cn } from "@/src/lib/utils/utils";
import * as React from "react";

export type Step = {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
};

interface StepperProps {
  steps: Step[];
  activeStep: number;
  onStepChange?: (stepIndex: number) => void;
  orientation?: "horizontal" | "vertical";
  className?: string;
  children?: React.ReactNode;
}

export function Stepper({
  steps,
  activeStep,
  onStepChange,
  orientation = "horizontal",
  className,
  children,
}: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <nav aria-label="Progress" className="mb-8">
        <ol
          className={cn(
            "flex",
            orientation === "horizontal"
              ? "flex-row items-center justify-between"
              : "flex-col space-y-4",
          )}
        >
          {steps.map((step, index) => {
            const isCompleted = index < activeStep;
            const isActive = index === activeStep;
            const isDisabled = index > activeStep;

            return (
              <li
                key={step.id}
                className={cn(
                  "relative flex items-center",
                  orientation === "horizontal" ? "flex-1" : "w-full",
                )}
              >
                <button
                  onClick={() => !isDisabled && onStepChange?.(index)}
                  disabled={isDisabled}
                  className={cn(
                    "flex items-center justify-center group w-full",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full",
                    isDisabled && "cursor-not-allowed opacity-60",
                    !isDisabled && "cursor-pointer",
                  )}
                >
                  <div className="relative flex items-center w-full justify-center">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 z-10 bg-white",
                        isCompleted &&
                          "border-primary bg-primary text-primary-foreground",
                        isActive &&
                          "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25",
                        !isCompleted &&
                          !isActive &&
                          "border-muted-foreground/30 bg-background text-muted-foreground",
                      )}
                    >
                      {isCompleted ? (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <span className="text-sm font-semibold">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    {orientation === "horizontal" &&
                      index < steps.length - 1 && (
                        <div
                          className={cn(
                            "absolute left-[calc(50%+20px)] top-1/2 h-0.5 w-[calc(100%-40px)] -translate-y-1/2 transition-all duration-300",
                            isCompleted
                              ? "bg-primary"
                              : "bg-muted-foreground/20",
                          )}
                        />
                      )}
                  </div>
                </button>
                {orientation === "vertical" && index < steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute left-5 top-10 h-8 w-0.5 transition-all duration-300",
                      isCompleted ? "bg-primary" : "bg-muted-foreground/20",
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      {children}
    </div>
  );
}
