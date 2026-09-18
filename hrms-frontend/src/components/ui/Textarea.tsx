"use client";

import { forwardRef, type ReactNode, type TextareaHTMLAttributes } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  rightElement?: ReactNode;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, rightElement, id, className = "", ...props }, ref) => {
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
          <textarea
            ref={ref}
            id={id}
            aria-invalid={!!error}
            className={[
              "w-full min-h-28 rounded-lg border px-4 py-3 text-sm text-ink outline-none transition",
              "placeholder:text-muted",
              "resize-y",
              error
                ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                : "border-border bg-surface-muted focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary-soft",
              rightElement ? "pr-16" : "",
              className,
            ].join(" ")}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3.5 top-4">{rightElement}</div>
          )}
        </div>

        {error && (
          <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
