// src/lib/holidays/holiday.service.ts
//
// /api/holidays (HolidayController, `* holidays` permissions) and the
// read-only employee view GET /api/leaves/holidays (`view leaves`).
// holiday_date is a plain "YYYY-MM-DD" string: it is date-only and must be
// shown through lib/date/format.ts (never through `new Date()`).
import { api } from "../api/axios";

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface Holiday {
  id: number;
  name: string;
  holiday_date: string;
  description: string | null;
  is_active: boolean;
}

export interface UpcomingHoliday {
  id: number;
  name: string;
  holiday_date: string;
  description: string | null;
  days_until: number;
}

export interface HolidayParams {
  year?: number;
  from_date?: string;
  to_date?: string;
  search?: string;
  is_active?: 0 | 1;
}

export interface HolidayPayload {
  name: string;
  holiday_date: string;
  description: string | null;
  is_active: boolean;
}

export const holidayService = {
  list: (params: HolidayParams, signal?: AbortSignal) =>
    api.get<Envelope<Holiday[]>>("/holidays", { params, signal }).then((r) => r.data.data),

  create: (payload: HolidayPayload) => api.post<Envelope<Holiday>>("/holidays", payload).then((r) => r.data),

  update: (id: number, payload: Partial<HolidayPayload>) =>
    api.put<Envelope<Holiday>>(`/holidays/${id}`, payload).then((r) => r.data),

  remove: (id: number) => api.delete<{ success: boolean; message: string }>(`/holidays/${id}`).then((r) => r.data),

  upcoming: (signal?: AbortSignal) =>
    api.get<Envelope<UpcomingHoliday[]>>("/leaves/holidays", { signal }).then((r) => r.data.data),
};
