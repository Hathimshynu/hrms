// src/lib/api/errors.ts
//
// Centralized mapping from an axios error to a user-safe message plus
// per-field validation errors, reused across every master/module page.
// Never surfaces raw backend/stack-trace detail - only the Laravel
// `message`/`errors` fields already meant for API consumers, or a generic
// fallback keyed off the HTTP status.
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

  // Never surface backend text for 5xx: it can contain SQL/stack details.
  const isServerError = typeof status === "number" && status >= 500;
  const message =
    (isServerError ? undefined : data?.message) ??
    (status ? STATUS_FALLBACKS[status] : undefined) ??
    (!status ? "Network error. Please check your connection and try again." : fallback);

  return { status, message, fieldErrors };
}
