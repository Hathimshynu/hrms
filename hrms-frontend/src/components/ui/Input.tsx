"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  rightElement?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, rightElement, id: idProp, className = "", ...props }, ref) => {
    // Generated id keeps <label htmlFor> associated with the control even when
    // the caller does not pass one (screen readers / click-to-focus).
    const generatedId = useId();
    const id = idProp ?? generatedId;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="mb-1.5 block text-sm font-semibold text-ink"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={id}
            aria-invalid={!!error}
            className={[
              "w-full h-12 rounded-lg border px-4 text-sm text-ink outline-none transition",
              "placeholder:text-muted",
              error
                ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                : "border-border bg-[#F2F2F2] focus:border-primary focus:bg-[#F2F2F2] focus:ring-4 focus:ring-primary-soft",
              rightElement ? "pr-16" : "",
              className,
            ].join(" ")}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
