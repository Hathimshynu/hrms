// src/lib/export/download.ts
//
// Server-side exports: the backend builds the whole filtered dataset (CSV or
// XLSX) behind the same permission as the corresponding list, and the browser
// only saves the returned file. The auth cookie travels via the shared axios
// client, so a missing permission surfaces as a normal 403.
import { api } from "../api/axios";

export type ExportFormat = "csv" | "xlsx";

export const EXPORT_FORMAT_LABEL: Record<ExportFormat, string> = {
  csv: "CSV",
  xlsx: "Excel (.xlsx)",
};

function filenameFrom(disposition: string | undefined, fallback: string): string {
  const match = disposition ? /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition) : null;
  return match ? decodeURIComponent(match[1]) : fallback;
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Drops empty filter values so the export query matches what the list sends. */
function cleanParams(params: Record<string, string | number | boolean | undefined | null>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );
}

export async function downloadServerExport(
  path: string,
  params: Record<string, string | number | boolean | undefined | null>,
  format: ExportFormat,
  fallbackName: string,
): Promise<void> {
  const response = await api.get<Blob>(path, {
    params: { ...cleanParams(params), format },
    responseType: "blob",
  });

  saveBlob(response.data, filenameFrom(response.headers["content-disposition"], `${fallbackName}.${format}`));
}
