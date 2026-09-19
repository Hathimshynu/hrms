// src/utils/dateFormat.ts
//
// SINGLE SOURCE OF TRUTH for user-visible dates and times (Mobile).
// Mirrors the Web module hrms-frontend/src/lib/date/format.ts - SAME contract:
//
//   DATE_FORMAT     = DD/MM/YYYY             e.g. 19/09/2026
//   TIME_FORMAT     = h:mm AM/PM             e.g. 9:05 AM, 12:00 PM, 12:30 AM
//   DATETIME_FORMAT = DD/MM/YYYY, h:mm AM/PM e.g. 19/09/2026, 6:45 PM
//   TIMEZONE        = Asia/Kolkata (IST, UTC+05:30, no DST)
//
// Backend shapes (verified against real responses):
//   "2026-09-19 18:45:00"  Laravel datetime, already Asia/Kolkata local -> used as is
//   "2026-09-19 00:00:00"  date-cast column -> calendar date
//   "2026-09-19"           date only
//   "09:00:00" / "09:00"   time only (policies)
//   "...T13:15:00Z" / "+05:30"  ISO with zone -> converted to IST
// Zone-less strings are read by components and never pass through the device
// timezone; date-only values never go through Date parsing (no day shift).
// Durations ("9h 10m", "8.5h") are not clock times - do not pass them here.
// No Intl / date library is used (Hermes Intl support varies), only arithmetic.

export const DATE_FORMAT = "DD/MM/YYYY";
export const TIME_FORMAT = "h:mm AM/PM";
export const DATETIME_FORMAT = "DD/MM/YYYY, h:mm AM/PM";
export const TIMEZONE = "Asia/Kolkata";
export const EMPTY_VALUE = "-";

const IST_OFFSET_MINUTES = 330;

interface Parts {
  y?: number;
  mo?: number;
  d?: number;
  h?: number;
  mi?: number;
}

const TIME_ONLY = /^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/;
const DATE_TIME =
  /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i;
const DMY = /^(\d{2})-(\d{2})-(\d{4})$/;

const pad2 = (n: number) => String(n).padStart(2, "0");

function validDate(y: number, mo: number, d: number): boolean {
  if (mo < 1 || mo > 12 || d < 1) return false;
  const probe = new Date(Date.UTC(y, mo - 1, d));
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === mo - 1 && probe.getUTCDate() === d;
}

function partsFromInstant(ms: number): Parts {
  const ist = new Date(ms + IST_OFFSET_MINUTES * 60_000);
  return {
    y: ist.getUTCFullYear(),
    mo: ist.getUTCMonth() + 1,
    d: ist.getUTCDate(),
    h: ist.getUTCHours(),
    mi: ist.getUTCMinutes(),
  };
}

function parse(value: unknown): Parts | null {
  if (value === null || value === undefined) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : partsFromInstant(value.getTime());
  }
  if (typeof value !== "string") return null;

  const text = value.trim();
  if (!text) return null;

  const time = TIME_ONLY.exec(text);
  if (time) {
    const h = Number(time[1]);
    const mi = Number(time[2]);
    return h < 24 && mi < 60 ? { h, mi } : null;
  }

  const dmy = DMY.exec(text);
  if (dmy) {
    const d = Number(dmy[1]);
    const mo = Number(dmy[2]);
    const y = Number(dmy[3]);
    return validDate(y, mo, d) ? { y, mo, d } : null;
  }

  const m = DATE_TIME.exec(text);
  if (!m) return null;

  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!validDate(y, mo, d)) return null;

  if (m[4] === undefined) return { y, mo, d };

  const h = Number(m[4]);
  const mi = Number(m[5]);
  if (h > 23 || mi > 59) return null;

  const zone = m[7];
  if (!zone) return { y, mo, d, h, mi };

  let offsetMinutes = 0;
  if (zone.toUpperCase() !== "Z") {
    const sign = zone[0] === "-" ? -1 : 1;
    const digits = zone.slice(1).replace(":", "");
    offsetMinutes = sign * (Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2, 4)));
  }
  return partsFromInstant(Date.UTC(y, mo - 1, d, h, mi) - offsetMinutes * 60_000);
}

function renderDate(p: Parts): string {
  return `${pad2(p.d as number)}/${pad2(p.mo as number)}/${String(p.y).padStart(4, "0")}`;
}

function renderTime(p: Parts): string {
  const h = p.h as number;
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad2(p.mi as number)} ${h >= 12 ? "PM" : "AM"}`;
}

/** DD/MM/YYYY. Time-only or invalid input returns "-". */
export function formatDate(value: unknown): string {
  const p = parse(value);
  return p && p.y !== undefined ? renderDate(p) : EMPTY_VALUE;
}

/** h:mm AM/PM. Date-only or invalid input returns "-". */
export function formatTime(value: unknown): string {
  const p = parse(value);
  return p && p.h !== undefined ? renderTime(p) : EMPTY_VALUE;
}

/** DD/MM/YYYY, h:mm AM/PM (date-only -> date; time-only -> time). */
export function formatDateTime(value: unknown): string {
  const p = parse(value);
  if (!p) return EMPTY_VALUE;
  if (p.y === undefined) return renderTime(p);
  if (p.h === undefined) return renderDate(p);
  return `${renderDate(p)}, ${renderTime(p)}`;
}

/**
 * Today's CALENDAR date in Asia/Kolkata as "YYYY-MM-DD" (machine value, not
 * for display). Never uses the device timezone or a UTC date slice, so it is
 * correct between 00:00 and 05:30 IST and when the device is set elsewhere.
 * `now` is injectable for tests.
 */
export function getTodayIST(now: Date = new Date()): string {
  const p = partsFromInstant(now.getTime());
  return `${String(p.y).padStart(4, "0")}-${pad2(p.mo as number)}-${pad2(p.d as number)}`;
}

/** Current month in Asia/Kolkata as "YYYY-MM" (machine value). */
export function getMonthKeyIST(now: Date = new Date()): string {
  return getTodayIST(now).slice(0, 7);
}

// ---- Backend INPUT helpers (machine values; never for display) ----------

/** Validates and normalizes a typed date to the API format "YYYY-MM-DD", else null. */
export function toApiDate(value: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m || !validDate(Number(m[1]), Number(m[2]), Number(m[3]))) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

/**
 * Validates and normalizes a typed date-time to the API format
 * "YYYY-MM-DD HH:mm:ss" (accepts "YYYY-MM-DD HH:mm", a "T" separator and
 * optional seconds), else null.
 */
export function toApiDateTime(value: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!m) return null;
  if (!validDate(Number(m[1]), Number(m[2]), Number(m[3]))) return null;
  const h = Number(m[4]);
  const mi = Number(m[5]);
  const s = m[6] === undefined ? 0 : Number(m[6]);
  if (h > 23 || mi > 59 || s > 59) return null;
  return `${m[1]}-${m[2]}-${m[3]} ${pad2(h)}:${pad2(mi)}:${pad2(s)}`;
}
