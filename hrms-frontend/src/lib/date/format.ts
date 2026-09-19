// src/lib/date/format.ts
//
// SINGLE SOURCE OF TRUTH for user-visible dates and times (Web).
// The Mobile app has an equivalent module (hrms-mobile/src/utils/dateFormat.ts)
// implementing the SAME contract:
//
//   DATE_FORMAT     = DD/MM/YYYY            e.g. 19/09/2026
//   TIME_FORMAT     = h:mm AM/PM            e.g. 9:05 AM, 12:00 PM, 12:30 AM
//   DATETIME_FORMAT = DD/MM/YYYY, h:mm AM/PM e.g. 19/09/2026, 6:45 PM
//   TIMEZONE        = Asia/Kolkata (IST, UTC+05:30, no DST)
//
// What the backend sends (verified against real responses):
//   - Laravel datetime      "2026-09-19 18:45:00"  -> already Asia/Kolkata local time
//   - date-cast column      "2026-09-19 00:00:00"  -> calendar date, time is meaningless
//   - date only             "2026-09-19"
//   - time only (policies)  "09:00:00" / "09:00"
//   - ISO with zone         "2026-09-19T13:15:00Z" / "+05:30" -> converted to IST
//
// Rules: zone-less strings are read by their components and NEVER passed
// through the browser timezone; date-only values never go through Date
// parsing, so the calendar day cannot shift. Durations ("9h 10m") are not
// clock times and must not be passed to these functions.

import { format as dfFormat } from "date-fns";

export const DATE_FORMAT = "dd/MM/yyyy";
export const TIME_FORMAT = "h:mm a";
export const DATETIME_FORMAT = "dd/MM/yyyy, h:mm a";
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
    const [d, mo, y] = [Number(dmy[1]), Number(dmy[2]), Number(dmy[3])];
    return validDate(y, mo, d) ? { y, mo, d } : null;
  }

  const m = DATE_TIME.exec(text);
  if (!m) return null;

  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!validDate(y, mo, d)) return null;

  if (m[4] === undefined) return { y, mo, d }; // date only

  const h = Number(m[4]);
  const mi = Number(m[5]);
  if (h > 23 || mi > 59) return null;

  const zone = m[7];
  if (!zone) return { y, mo, d, h, mi }; // Laravel local (Asia/Kolkata) - as is

  let offsetMinutes = 0;
  if (zone.toUpperCase() !== "Z") {
    const sign = zone[0] === "-" ? -1 : 1;
    const digits = zone.slice(1).replace(":", "");
    offsetMinutes = sign * (Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2, 4)));
  }
  return partsFromInstant(Date.UTC(y, mo - 1, d, h, mi) - offsetMinutes * 60_000);
}

// Fixed reference day (noon / Jan 1) so date-fns never lands in a DST gap of
// the device timezone; only the components are used for display.
function asDateOnly(p: Parts): Date {
  return new Date(p.y as number, (p.mo as number) - 1, p.d as number, 12, 0, 0);
}
function asTimeOnly(p: Parts): Date {
  return new Date(2000, 0, 1, p.h as number, p.mi as number, 0);
}

/** DD/MM/YYYY. Time-only or invalid input returns "-". */
export function formatDate(value: unknown): string {
  const p = parse(value);
  if (!p || p.y === undefined) return EMPTY_VALUE;
  return dfFormat(asDateOnly(p), DATE_FORMAT);
}

/** h:mm AM/PM. Date-only or invalid input returns "-". */
export function formatTime(value: unknown): string {
  const p = parse(value);
  if (!p || p.h === undefined) return EMPTY_VALUE;
  return dfFormat(asTimeOnly(p), TIME_FORMAT);
}

/**
 * DD/MM/YYYY, h:mm AM/PM. A date-only value shows just the date; a
 * time-only value shows just the time.
 */
export function formatDateTime(value: unknown): string {
  const p = parse(value);
  if (!p) return EMPTY_VALUE;
  if (p.y === undefined) return formatTime(value);
  if (p.h === undefined) return dfFormat(asDateOnly(p), DATE_FORMAT);
  return `${dfFormat(asDateOnly(p), DATE_FORMAT)}, ${dfFormat(asTimeOnly(p), TIME_FORMAT)}`;
}

/** "Sat, 19/09/2026, 6:45 PM" - same standard with the weekday prefix. */
export function formatDateTimeWithDay(value: unknown): string {
  const p = parse(value);
  if (!p || p.y === undefined) return formatDateTime(value);
  return `${dfFormat(asDateOnly(p), "EEE")}, ${formatDateTime(value)}`;
}

/**
 * Machine value for <input type="date"> (YYYY-MM-DD). Accepts every backend
 * shape ("2026-09-19 00:00:00", "2026-09-19", "19-09-2026"); returns "" when
 * not a valid date so the input simply stays empty.
 */
export function toDateInputValue(value: unknown): string {
  const p = parse(value);
  if (!p || p.y === undefined) return "";
  return `${String(p.y).padStart(4, "0")}-${String(p.mo).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

/** Machine value for <input type="time"> (HH:mm) from "09:00:00" / "09:00". */
export function toTimeInputValue(value: unknown): string {
  const p = parse(value);
  if (!p || p.h === undefined) return "";
  return `${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}`;
}

/**
 * Today's CALENDAR date in Asia/Kolkata as "YYYY-MM-DD" (machine value, not
 * for display). Independent of the device timezone. `now` is injectable.
 */
export function getTodayIST(now: Date = new Date()): string {
  const p = partsFromInstant(now.getTime());
  return `${String(p.y).padStart(4, "0")}-${String(p.mo).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

/** Current month in Asia/Kolkata as "YYYY-MM" (machine value). */
export function getMonthKeyIST(now: Date = new Date()): string {
  return getTodayIST(now).slice(0, 7);
}

/**
 * A local Date whose Y/M/D equal today's Asia/Kolkata calendar date, for
 * calendar widgets (react-day-picker / date-fns compare local Y/M/D). Only
 * the calendar day is meaningful; do not use its time or format it as a time.
 */
export function todayISTAsLocalDate(now: Date = new Date()): Date {
  const [y, m, d] = getTodayIST(now).split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/**
 * "YYYY-MM-DD" from the LOCAL Y/M/D of a Date. Use this for dates picked in a
 * calendar widget (react-day-picker returns local-midnight Dates): the picked
 * calendar day is the value, not an instant to be converted to another zone.
 */
export function localDateKey(date: Date): string {
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
