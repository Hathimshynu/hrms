"use client";

import { cn } from "@/src/lib/utils/utils";
import {
  ArrowLeft,
  CircleDashed,
  Code2,
  Construction,
  Rocket,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface UnderDevelopmentProps {
  title: string;
  description?: string;
  progress?: number;
  status?: "in-progress" | "coming-soon" | "planned";
  expectedDate?: string;
  backLabel?: string;
  className?: string;
}

const statusConfig = {
  "in-progress": {
    label: "In Development",
    icon: Code2,
  },
  "coming-soon": {
    label: "Coming Soon",
    icon: Rocket,
  },
  planned: {
    label: "Planned",
    icon: CircleDashed,
  },
};

export function UnderDevelopment({
  title,
  description = "This module is currently under development. We're working on bringing this feature to you.",
  progress = 65,
  status = "in-progress",
  expectedDate,
  backLabel = "Back",
  className,
}: UnderDevelopmentProps) {
  const router = useRouter();

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  const safeProgress = Math.min(Math.max(progress, 0), 100);

  const handleBack = () => {
    router.back();
  };

  return (
    <div
      className={cn(
        "relative flex min-h-[calc(100vh-80px)] items-center justify-center overflow-hidden p-6",
        className,
      )}
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-[var(--color-primary)]/8 blur-3xl" />

        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--color-primary)]/5 blur-3xl" />

        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[var(--color-primary)]/5 blur-3xl" />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-2xl">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[0_20px_60px_rgba(16,33,43,0.08)] sm:p-10">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-[var(--color-primary)]/10 blur-xl" />

              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--color-primary)]/20 bg-[var(--color-primary-soft)]">
                <Construction
                  size={38}
                  strokeWidth={1.8}
                  className="text-[var(--color-primary)]"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary-soft)] px-3 py-1.5">
              <StatusIcon size={14} className="text-[var(--color-primary)]" />

              <span className="text-xs font-semibold tracking-wide text-[var(--color-primary-dark)]">
                {currentStatus.label}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="mt-5 text-center">
            <h1 className="text-3xl sm:text-4xl">{title}</h1>

            <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base">
              {description}
            </p>
          </div>

          {/* Expected Date */}
          {expectedDate && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              <span className="text-[var(--color-muted)]">Expected:</span>

              <span className="font-semibold text-[var(--color-ink)]">
                {expectedDate}
              </span>
            </div>
          )}

          {/* Back Button */}
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-muted)]"
            >
              <ArrowLeft size={16} />
              {backLabel}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-5 text-center text-xs text-[var(--color-muted)]">
          More features will be available as development progresses.
        </p>
      </div>
    </div>
  );
}
