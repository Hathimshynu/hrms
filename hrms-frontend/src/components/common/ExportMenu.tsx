"use client";

import { Download } from "lucide-react";
import * as React from "react";

import { parseApiError } from "@/src/lib/api/errors";
import { EXPORT_FORMAT_LABEL, type ExportFormat } from "@/src/lib/export/download";

interface ExportMenuProps {
  /** Performs the export for the chosen format; throw to surface an error. */
  onExport: (format: ExportFormat) => Promise<void> | void;
  disabled?: boolean;
  /** Accessible name context, e.g. "leave requests". */
  label?: string;
  className?: string;
  /** Smaller button for card/section headers. */
  compact?: boolean;
}

const FORMATS: ExportFormat[] = ["csv", "xlsx"];

// Reusable Export control: a button that opens a two-item menu (CSV / Excel).
// Shows a busy state, blocks duplicate clicks, and reports failures inline.
// Keyboard: Enter/Space/ArrowDown open, ArrowUp/Down move, Escape closes and
// returns focus to the button.
export function ExportMenu({ onExport, disabled = false, label = "data", className = "", compact = false }: ExportMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState<ExportFormat | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const menuId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  React.useEffect(() => {
    if (open) rootRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [open]);

  const run = async (format: ExportFormat) => {
    if (busy) return;
    setOpen(false);
    setBusy(format);
    setError(null);
    try {
      await onExport(format);
    } catch (err) {
      setError(parseApiError(err, "Export failed. Please try again.").message);
    } finally {
      setBusy(null);
      buttonRef.current?.focus();
    }
  };

  const onMenuKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(index + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    }
  };

  return (
    <div className={`relative ${className}`} ref={rootRef} onKeyDown={open ? onMenuKey : undefined}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Export ${label}`}
        disabled={disabled || busy !== null}
        onClick={() => setOpen((o) => !o)}
        className={`flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg border border-border bg-surface text-sm font-semibold text-ink transition-colors hover:border-primary/30 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60 ${compact ? "h-9 px-3" : "h-10 px-3.5 sm:h-12 sm:px-4"}`}
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        <span className={compact ? "" : "hidden sm:inline"}>{busy ? "Exporting…" : "Export"}</span>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={`Export ${label} as`}
          className="absolute right-0 z-30 mt-2 min-w-40 overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-lg"
        >
          {FORMATS.map((format) => (
            <button
              key={format}
              type="button"
              role="menuitem"
              onClick={() => run(format)}
              className="flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-sm text-ink-soft transition-colors hover:bg-surface-muted focus:bg-surface-muted"
            >
              {EXPORT_FORMAT_LABEL[format]}
            </button>
          ))}
        </div>
      )}

      <span role="status" aria-live="polite" className="sr-only">
        {busy ? `Exporting ${label}` : ""}
      </span>
      {error && (
        <p role="alert" className="absolute right-0 top-full z-20 mt-1 w-64 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 shadow">
          {error}
        </p>
      )}
    </div>
  );
}
