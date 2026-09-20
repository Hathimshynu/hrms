// src/lib/leave/leave.service.ts
import { api } from "../api/axios";
import type {
  ApplyLeavePayload,
  LeaveBalance,
  LeaveListParams,
  LeaveRecord,
  LeaveTypeOption,
  Paginated,
} from "./leave.types";

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const leaveService = {
  types: () => api.get<Envelope<LeaveTypeOption[]>>("/leaves/types").then((r) => r.data.data),

  balance: (year?: number) =>
    api.get<Envelope<LeaveBalance>>("/leaves/balance", { params: { year } }).then((r) => r.data.data),

  // Self-service: the backend derives the employee from the session.
  list: (params?: LeaveListParams) =>
    api.get<Envelope<Paginated<LeaveRecord>>>("/leaves", { params }).then((r) => r.data.data),

  apply: (payload: ApplyLeavePayload) =>
    api.post<Envelope<LeaveRecord>>("/leaves", payload).then((r) => r.data),

  cancel: (id: number) =>
    api.post<Envelope<LeaveRecord>>(`/leaves/${id}/cancel`).then((r) => r.data),

  // Reviewer scope (approve leaves / reject leaves).
  adminList: (params?: LeaveListParams) =>
    api.get<Envelope<Paginated<LeaveRecord>>>("/leaves/admin", { params }).then((r) => r.data.data),

  approve: (id: number) =>
    api.post<Envelope<LeaveRecord>>(`/leaves/${id}/approve`).then((r) => r.data),

  reject: (id: number, rejection_reason: string) =>
    api.post<Envelope<LeaveRecord>>(`/leaves/${id}/reject`, { rejection_reason }).then((r) => r.data),
};
