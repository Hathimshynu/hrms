"use client";

import { forwardRef, InputHTMLAttributes } from "react";

interface FormCheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
  error?: string;
  description?: string;
  className?: string;
}

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ label, error, description, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              ref={ref}
              className={`
    h-4 w-4 rounded border-gray-300 
    text-black 
    cursor-pointer transition-colors
    focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0
    focus:ring-0 focus:ring-offset-0  // Add these to remove all focus rings
    focus:outline-none
    ${error ? "border-red-500 focus-visible:ring-red-500" : ""}
    ${className}
  `}
              {...props}
            />
          </div>
          <div className="flex flex-col">
            {label && (
              <span
                className={`
                  text-sm font-medium text-gray-700 
                  group-hover:text-black transition-colors
                  ${error ? "text-red-600 group-hover:text-red-700" : ""}
                `}
              >
                {label}
              </span>
            )}
            {description && (
              <span className="text-xs text-gray-500 mt-0.5">
                {description}
              </span>
            )}
          </div>
        </label>
        {error && (
          <span className="text-xs text-red-600 mt-0.5 ml-8">{error}</span>
        )}
      </div>
    );
  },
);

FormCheckbox.displayName = "FormCheckbox";
