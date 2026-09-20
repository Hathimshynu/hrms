"use client";

import { ArrowLeft } from "lucide-react";
import * as React from "react";

import { InlineBanner } from "@/src/components/common/InlineBanner";
import { usePermission } from "@/src/hooks/usePermission";
import { parseApiError } from "@/src/lib/api/errors";
import { leaveService } from "@/src/lib/leave/leave.service";
import type { LeaveBalance, LeaveTypeOption } from "@/src/lib/leave/leave.types";
import { MENU_MODULES } from "@/src/permissions/permissions";
import { ApplyLeaveDialog } from "./components/ApplyLeaveDialog";
import { LeaveBalanceCards } from "./components/LeaveBalanceCards";
import { LeaveReview } from "./components/LeaveReview";
import { MyLeaves } from "./components/MyLeaves";

export default function LeavePage() {
  const own = usePermission(MENU_MODULES.LEAVES);
  const review = usePermission(MENU_MODULES.LEAVE_REVIEW);
  // Menu access mirrors backend permissions: own.edit = `edit leaves` (cancel
  // own), review.view = `approve leaves`, review.edit = `reject leaves`.
  const canReview = review.view || review.edit;

  // A user with no linked employee profile gets 404 on every self-service
  // endpoint; detect it once instead of showing several failing widgets.
  const [profile, setProfile] = React.useState<"checking" | "linked" | "missing">("checking");
  const [balance, setBalance] = React.useState<LeaveBalance | null>(null);
  const [balanceError, setBalanceError] = React.useState<string | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = React.useState(true);
  const [types, setTypes] = React.useState<LeaveTypeOption[]>([]);
  const [applyOpen, setApplyOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [notice, setNotice] = React.useState<string | null>(null);

  const loadBalance = React.useCallback(async () => {
    setIsBalanceLoading(true);
    setBalanceError(null);
    try {
      setBalance(await leaveService.balance());
      setProfile("linked");
    } catch (err) {
      const info = parseApiError(err, "Failed to load leave balance.");
      if (info.status === 404) {
        setProfile("missing");
      } else {
        setProfile("linked");
        setBalanceError(info.message);
      }
    } finally {
      setIsBalanceLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadBalance(); // eslint-disable-line react-hooks/set-state-in-effect
    leaveService.types().then(setTypes).catch(() => setTypes([]));
  }, [loadBalance]);

  const changed = () => {
    setRefreshKey((k) => k + 1);
    loadBalance();
  };

  return (
    <div className="min-h-screen w-full bg-[#F2F2F2]">
      <div className="sticky top-0 z-50 bg-[#F2F2F2] py-4 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Go back"
            className="group flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-primary sm:h-10 sm:w-10"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5 text-black group-hover:text-white" />
          </button>
          <h1 className="truncate text-lg font-light sm:text-2xl">Leave</h1>
        </div>
      </div>

      <div className="grid w-full grid-cols-[minmax(0,1fr)] gap-4 px-3 py-4 sm:px-6 lg:px-8">
        {notice && <InlineBanner type="success" message={notice} />}

        {profile === "checking" && <div className="h-40 animate-pulse rounded-2xl bg-black/5" aria-hidden="true" />}

        {profile === "missing" && (
          <div role="status" className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
            <p className="text-base font-semibold text-ink">Personal leave unavailable</p>
            <p className="max-w-md text-sm text-ink-soft">
              No employee profile is linked to this user account, so you cannot apply for leave or see a balance.
              Contact HR to link your account to an employee record.
            </p>
          </div>
        )}

        {profile === "linked" && (
          <>
            <LeaveBalanceCards balance={balance} isLoading={isBalanceLoading} error={balanceError} />
            <MyLeaves
              types={types}
              refreshKey={refreshKey}
              canApply={own.view}
              canCancel={own.edit}
              onApply={() => setApplyOpen(true)}
              onChanged={changed}
            />
          </>
        )}

        {canReview && (
          <LeaveReview types={types} canApprove={review.view} canReject={review.edit} onReviewed={changed} />
        )}
      </div>

      <ApplyLeaveDialog
        open={applyOpen}
        onOpenChange={setApplyOpen}
        types={types}
        onApplied={() => {
          setNotice("Leave request submitted.");
          changed();
        }}
      />
    </div>
  );
}
