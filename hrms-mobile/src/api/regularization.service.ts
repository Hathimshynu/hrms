// src/api/regularization.service.ts
//
// Employee self-service only (per Phase 6 scope) - admin approve/reject
// endpoints are intentionally not called from this app.
import { api } from "./client";
import type {
  CreateRegularizationPayload,
  PaginatedResponse,
  RegularizationRecord,
  RegularizationStatus,
} from "../attendance/attendance.types";

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const regularizationService = {
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
};
