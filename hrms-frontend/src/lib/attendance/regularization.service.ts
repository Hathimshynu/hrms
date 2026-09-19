// src/lib/attendance/regularization.service.ts
import { api } from "../api/axios";
import type {
  CreateRegularizationPayload,
  PaginatedResponse,
  RegularizationRecord,
  RegularizationStatus,
} from "./attendance.types";

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const regularizationService = {
  // Self-service - scoped server-side to the authenticated employee.
  create: (payload: CreateRegularizationPayload) =>
    api
      .post<Envelope<RegularizationRecord>>("/attendance/regularizations", payload)
      .then((r) => r.data),

  list: (params?: { status?: RegularizationStatus; per_page?: number; page?: number }) =>
    api
      .get<Envelope<PaginatedResponse<RegularizationRecord>>>("/attendance/regularizations", {
        params,
      })
      .then((r) => r.data.data),

  show: (id: number) =>
    api
      .get<Envelope<RegularizationRecord>>(`/attendance/regularizations/${id}`)
      .then((r) => r.data.data),

  cancel: (id: number) =>
    api
      .put<Envelope<RegularizationRecord>>(`/attendance/regularizations/${id}/cancel`)
      .then((r) => r.data),

  // Admin/HR scope - requires `view attendance` for the list, `edit attendance`
  // to approve/reject (verified in routes/api.php).
  adminList: (params?: {
    employee_id?: number;
    status?: RegularizationStatus;
    from_date?: string;
    to_date?: string;
    per_page?: number;
    page?: number;
  }) =>
    api
      .get<Envelope<PaginatedResponse<RegularizationRecord>>>(
        "/attendance/admin/regularizations",
        { params }
      )
      .then((r) => r.data.data),

  approve: (id: number, reviewer_remarks?: string) =>
    api
      .put<Envelope<RegularizationRecord>>(`/attendance/admin/regularizations/${id}/approve`, {
        reviewer_remarks,
      })
      .then((r) => r.data),

  reject: (id: number, reviewer_remarks: string) =>
    api
      .put<Envelope<RegularizationRecord>>(`/attendance/admin/regularizations/${id}/reject`, {
        reviewer_remarks,
      })
      .then((r) => r.data),
};
