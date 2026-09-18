"use client";

import { Button } from "@/src/components/ui/Button";
import { Column, DataTable, StatusPill } from "@/src/components/ui/Datatable";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Textarea } from "@/src/components/ui/Textarea";
import {
  Building2,
  Calendar,
  Clock,
  FileText,
  Hash,
  History,
  User,
} from "lucide-react";
import * as React from "react";

interface LeaveRequest {
  id: string;
  employeeId: string;
  name: string;
  avatar?: string;
  jobTitle: string;
  department: string;
  type:
    | "Annual Leave"
    | "Sick Leave"
    | "Casual Leave"
    | "Maternity Leave"
    | "Paternity Leave";
  startDate: string;
  endDate: string;
  duration: string;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  reason?: string;
  appliedOn: string;
}

interface ViewLeaveDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leave: LeaveRequest | null;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
  allLeaveRequests?: LeaveRequest[];
}

export function ViewLeaveDetails({
  open,
  onOpenChange,
  leave,
  onApprove,
  onReject,
  allLeaveRequests = [],
}: ViewLeaveDetailsProps) {
  if (!leave) return null;

  const [isRejectDialogOpen, setIsRejectDialogOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [rejectError, setRejectError] = React.useState("");

  const employeeHistory = React.useMemo(() => {
    return allLeaveRequests
      .filter(
        (request) =>
          request.employeeId === leave.employeeId && request.id !== leave.id,
      )
      .sort((a, b) => {
        return (
          new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime()
        );
      });
  }, [allLeaveRequests, leave]);

  const getStatusColor = (status: LeaveRequest["status"]) => {
    switch (status) {
      case "Pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Rejected":
        return "bg-red-50 text-red-700 border-red-200";
      case "Cancelled":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getLeaveTypeColor = (type: LeaveRequest["type"]) => {
    switch (type) {
      case "Annual Leave":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Sick Leave":
        return "bg-red-50 text-red-700 border-red-200";
      case "Casual Leave":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Maternity Leave":
        return "bg-pink-50 text-pink-700 border-pink-200";
      case "Paternity Leave":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const InfoItem = ({
    icon,
    label,
    value,
  }: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
  }) => (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="mt-0.5 text-muted">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-muted uppercase tracking-wider">
          {label}
        </div>
        <div className="text-sm font-medium text-ink mt-0.5 wrap-break-word">
          {value}
        </div>
      </div>
    </div>
  );

  const historyColumns: Column<LeaveRequest>[] = [
    {
      key: "type",
      header: "Leave Type",
      accessor: (row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getLeaveTypeColor(
            row.type,
          )}`}
        >
          {row.type}
        </span>
      ),
      sortValue: (row) => row.type,
    },
    {
      key: "dates",
      header: "Dates & Duration",
      accessor: (row) => (
        <div>
          <div className="text-sm font-medium">
            {row.startDate} - {row.endDate}
          </div>
          <div className="text-xs text-muted">{row.duration}</div>
        </div>
      ),
      sortValue: (row) => row.startDate,
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => <StatusPill status={row.status} />,
      sortValue: (row) => row.status,
    },
    {
      key: "appliedOn",
      header: "Applied On",
      sortValue: (row) => row.appliedOn,
    },
  ];

  const handleRejectWithReason = () => {
    if (!rejectReason.trim()) {
      setRejectError("Please provide a reason for rejection");
      return;
    }
    if (onReject) {
      onReject(leave.id, rejectReason.trim());
      setIsRejectDialogOpen(false);
      setRejectReason("");
      setRejectError("");
      onOpenChange(false);
    }
  };

  const handleRejectDialogClose = () => {
    setIsRejectDialogOpen(false);
    setRejectReason("");
    setRejectError("");
  };

  return (
    <>
      {/* Main Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="bg-primary text-primary-foreground px-4 sm:px-6 py-3 sm:py-4">
            <DialogTitle className="text-lg sm:text-xl">
              Leave Request Details
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(90vh-12rem)] px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 pb-6 border-b">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-ink">
                  {leave.name}
                </h3>
                <p className="text-sm text-muted">{leave.jobTitle}</p>
                <p className="text-xs text-muted mt-1">
                  ID: {leave.employeeId}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                    leave.status,
                  )}`}
                >
                  {leave.status}
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getLeaveTypeColor(
                    leave.type,
                  )}`}
                >
                  {leave.type}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <InfoItem
                icon={<Building2 className="h-4 w-4" />}
                label="Department"
                value={leave.department}
              />
              <InfoItem
                icon={<Hash className="h-4 w-4" />}
                label="Duration"
                value={leave.duration}
              />
              <InfoItem
                icon={<Calendar className="h-4 w-4" />}
                label="Start Date"
                value={leave.startDate}
              />
              <InfoItem
                icon={<Calendar className="h-4 w-4" />}
                label="End Date"
                value={leave.endDate}
              />
              <InfoItem
                icon={<Clock className="h-4 w-4" />}
                label="Applied On"
                value={leave.appliedOn}
              />
              <InfoItem
                icon={<User className="h-4 w-4" />}
                label="Date Range"
                value={`${leave.startDate} - ${leave.endDate}`}
              />
            </div>

            {leave.reason && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-border">
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-muted uppercase tracking-wider">
                      Reason
                    </div>
                    <p className="text-sm text-ink mt-1 break-words">
                      {leave.reason}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {employeeHistory.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <History className="h-4 w-4 text-muted flex-shrink-0" />
                  <h4 className="text-sm font-semibold text-ink">
                    Leave History ({employeeHistory.length} previous requests)
                  </h4>
                </div>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="min-w-[640px] sm:min-w-0">
                    <DataTable
                      data={employeeHistory}
                      columns={historyColumns}
                      keyExtractor={(row: LeaveRequest) => row.id}
                      searchKeys={["type", "status"]}
                      pageSize={5}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-gray-50/50">
            <div className="flex w-full flex-col-reverse sm:flex-row items-center justify-end gap-3">
              {leave.status === "Pending" && (
                <>
                  {onReject && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setIsRejectDialogOpen(true)}
                      className="w-full sm:w-auto min-w-[120px]"
                    >
                      Reject
                    </Button>
                  )}
                  {onApprove && (
                    <Button
                      type="button"
                      onClick={() => {
                        onApprove(leave.id);
                        onOpenChange(false);
                      }}
                      className="w-full sm:w-auto min-w-[120px] bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Approve
                    </Button>
                  )}
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={handleRejectDialogClose}>
        <DialogContent className="sm:max-w-lg p-0" showCloseButton={true}>
          <DialogHeader className="bg-primary text-primary-foreground px-4 sm:px-6 py-3 sm:py-4">
            <DialogTitle className="text-lg sm:text-xl">
              Reject Leave Request
            </DialogTitle>
          </DialogHeader>

          <div className="px-4 sm:px-6 py-4">
            <div className="space-y-2">
              <Textarea
                label="Rejection Reason"
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (rejectError) setRejectError("");
                }}
                placeholder="Enter reason for rejecting this leave request..."
                className={`w-full min-h-30 ${
                  rejectError ? "border-red-500" : ""
                }`}
              />
              {rejectError && (
                <p className="text-sm text-red-500">{rejectError}</p>
              )}
            </div>
          </div>

          <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t flex flex-col-reverse sm:flex-row justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleRejectDialogClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleRejectWithReason}
              className="w-full sm:w-auto"
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
