// src/api/errors.ts
//
// Mirrors hrms-frontend/src/lib/api/errors.ts exactly (same backend, same
// error envelope) - one error-handling system reused across web and mobile,
// not reinvented. Never surfaces raw stack traces/exception detail.
import { isAxiosError } from "axios";

export interface ApiErrorInfo {
  status?: number;
  message: string;
  fieldErrors: Record<string, string>;
}

interface LaravelErrorBody {
  message?: string;
  errors?: Record<string, string[] | string>;
}

const STATUS_FALLBACKS: Record<number, string> = {
  400: "Invalid request. Please check your input and try again.",
  401: "Your session has expired. Please log in again.",
  403: "You don't have permission to perform this action.",
  404: "The requested item could not be found.",
  409: "This action conflicts with existing data.",
  422: "Please fix the highlighted fields and try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on the server. Please try again later.",
};

export function parseApiError(
  err: unknown,
  fallback = "Something went wrong. Please try again."
): ApiErrorInfo {
  if (!isAxiosError<LaravelErrorBody>(err)) {
    return { message: fallback, fieldErrors: {} };
  }

  const status = err.response?.status;
  const data = err.response?.data;

  const fieldErrors: Record<string, string> = {};
  if (data?.errors) {
    for (const [field, messages] of Object.entries(data.errors)) {
      fieldErrors[field] = Array.isArray(messages) ? messages[0] : String(messages);
    }
  }

  const message =
    data?.message ??
    (status ? STATUS_FALLBACKS[status] : undefined) ??
    (!status ? "Network error. Please check your connection and try again." : fallback);

  return { status, message, fieldErrors };
}
