"use client";

import { formatDateTime } from "@/src/lib/date/format";
import { DeleteAlert } from "@/src/components/common/ReusableAlert";
import { InlineBanner } from "@/src/components/common/InlineBanner";
import { Column, DataTable, StatusPill } from "@/src/components/ui/Datatable";
import { usePermission } from "@/src/hooks/usePermission";
import { parseApiError } from "@/src/lib/api/errors";
import {
  onboardingService,
  type DraftListItem,
} from "@/src/lib/employees/onboarding.service";
import { MENU_MODULES } from "@/src/permissions/permissions";
import { ArrowLeft } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import { AddEmployee } from "../components/AddEmployee/AddEmployee";

// GET /employee-onboarding/drafts is scoped server-side to
// `created_by = current user` (see EmployeeDraftController@index), so this
// list is inherently "my drafts" - there is nothing to filter by owner.
const TOTAL_STEPS = 11;

const columns: Column<DraftListItem>[] = [
  {
    key: "employee",
    header: "Employee",
    accessor: (row) => {
      const name = row.employee
        ? `${row.employee.first_name} ${row.employee.last_name}`.trim()
        : null;
      return (
        <div className="min-w-0">
          <span className="font-medium text-stone-800 block truncate">
            {name || "Not yet named"}
          </span>
          <span className="text-xs text-gray-500 block">
            {row.employee?.employee_code || `Draft #${row.id}`}
          </span>
        </div>
      );
    },
    sortValue: (row) =>
      row.employee ? `${row.employee.first_name} ${row.employee.last_name}` : "",
    hideable: false,
  },
  {
    key: "email",
    header: "Email",
    accessor: (row) => row.employee?.email || "—",
  },
  {
    key: "progress",
    header: "Progress",
    // completed_steps / current_step are the only progress data the list
    // endpoint actually returns (see DraftListItem in onboarding.service.ts) -
    // no percentage/label field exists, so it is derived here from the
    // known total step count (11) rather than fabricated.
    accessor: (row) => (
      <span className="text-sm text-ink-soft">
        Step {row.current_step} of {TOTAL_STEPS} · {row.completed_steps.length}{" "}
        completed
      </span>
    ),
    sortValue: (row) => row.completed_steps.length,
  },
  {
    key: "status",
    header: "Status",
    accessor: (row) => <StatusPill status={row.status} />,
  },
  {
    key: "last_saved_at",
    header: "Last saved",
    accessor: (row) => formatDateTime(row.last_saved_at),
    sortValue: (row) => row.last_saved_at || "",
  },
];

export default function EmployeeDraftsPage() {
  const { edit: canResume, delete: canCancel } = usePermission(
    MENU_MODULES.EMPLOYEE_DRAFTS
  );

  const [drafts, setDrafts] = useState<DraftListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isResumeDrawerOpen, setIsResumeDrawerOpen] = useState(false);

  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);
  const [draftToCancel, setDraftToCancel] = useState<DraftListItem | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const loadDrafts = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await onboardingService.listDrafts();
      setDrafts(data);
    } catch (err) {
      setLoadError(parseApiError(err, "Failed to load onboarding drafts.").message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  // The backend only ever tracks one active ("status = draft") draft per
  // user - EmployeeOnboardingService::start() looks up that single row and
  // returns it instead of creating a second one (see hrms-backend
  // app/Services/EmployeeOnboardingService.php). Since this list can only
  // ever contain that same one draft, "Resume" simply re-opens the normal
  // Add Employee wizard, which auto-resumes it exactly as it does from the
  // People page today.
  const handleResume = () => {
    setIsResumeDrawerOpen(true);
  };

  const handleCancelClick = (draft: DraftListItem) => {
    setDraftToCancel(draft);
    setCancelError(null);
    setIsCancelAlertOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!draftToCancel) return;

    setIsCancelling(true);
    setCancelError(null);
    try {
      await onboardingService.cancelDraft(draftToCancel.id);
      setSuccessMessage("Draft cancelled successfully.");
      setIsCancelAlertOpen(false);
      setDraftToCancel(null);
      await loadDrafts();
    } catch (err) {
      setCancelError(parseApiError(err, "Failed to cancel this draft.").message);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelDismiss = () => {
    if (isCancelling) return;
    setIsCancelAlertOpen(false);
    setDraftToCancel(null);
    setCancelError(null);
  };

  return (
    <div className="min-h-screen w-full py-4 px-3 sm:px-8 bg-[#F2F2F2] grid grid-cols-[minmax(0,1fr)] gap-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-3 items-center">
          <button type="button" aria-label="Go back"
            className="group flex h-12 w-12 cursor-pointer items-center justify-center rounded-full hover:bg-primary sm:h-10 sm:w-10"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5 text-black group-hover:text-white" />
          </button>

          <h1 className="text-lg sm:text-2xl font-light">
            Employee Onboarding Drafts
          </h1>
        </div>
      </div>

      {successMessage && <InlineBanner type="success" message={successMessage} />}
      {loadError && <InlineBanner type="error" message={loadError} />}

      <div className="w-full overflow-x-auto">
        <DataTable
          data={drafts}
          columns={columns}
          keyExtractor={(row) => row.id}
          searchKeys={["status"]}
          selectable={false}
          pageSize={20}
          isLoading={isLoading}
          emptyMessage="You have no in-progress onboarding drafts."
          onEditRow={canResume ? handleResume : undefined}
          onDeleteRow={canCancel ? handleCancelClick : undefined}
          actionColumnHeader="Actions"
        />
      </div>

      <AddEmployee
        isOpen={isResumeDrawerOpen}
        setIsOpen={setIsResumeDrawerOpen}
        onCompleted={() => {
          setSuccessMessage("Employee onboarding completed successfully.");
          loadDrafts();
        }}
      />

      <DeleteAlert
        open={isCancelAlertOpen}
        onOpenChange={(open) => {
          if (!open) handleCancelDismiss();
        }}
        title="Cancel this draft?"
        description={
          cancelError ||
          `Are you sure you want to cancel this onboarding draft${
            draftToCancel?.employee
              ? ` for "${draftToCancel.employee.first_name} ${draftToCancel.employee.last_name}"`
              : ""
          }? This will mark it as cancelled - it can't be resumed afterward.`
        }
        confirmText={isCancelling ? "Cancelling..." : "Cancel Draft"}
        cancelText="Keep Draft"
        onConfirm={handleConfirmCancel}
        onCancel={handleCancelDismiss}
        loading={isCancelling}
      />
    </div>
  );
}
