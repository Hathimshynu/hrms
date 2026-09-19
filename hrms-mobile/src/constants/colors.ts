// src/constants/colors.ts
export const colors = {
  primary: "#4F6EF7",
  primaryDark: "#3B54D6",
  primarySoft: "#EEF1FE",
  background: "#F2F3F7",
  surface: "#FFFFFF",
  border: "#E5E7EB",
  ink: "#111827",
  inkSoft: "#4B5563",
  muted: "#9CA3AF",
  success: "#10B981",
  successSoft: "#ECFDF5",
  danger: "#EF4444",
  dangerSoft: "#FEF2F2",
  warning: "#F59E0B",
  warningSoft: "#FFFBEB",
  info: "#3B82F6",
  infoSoft: "#EFF6FF",
};

export const statusColors: Record<string, { bg: string; text: string }> = {
  Present: { bg: "#ECFDF5", text: "#047857" },
  Late: { bg: "#FFFBEB", text: "#B45309" },
  "Half Day": { bg: "#F5F3FF", text: "#6D28D9" },
  "On Leave": { bg: "#FDF2F8", text: "#BE185D" },
  Absent: { bg: "#FEF2F2", text: "#B91C1C" },
  Holiday: { bg: "#EFF6FF", text: "#1D4ED8" },
  "Week Off": { bg: "#F3F4F6", text: "#374151" },
  Pending: { bg: "#FFFBEB", text: "#B45309" },
  Approved: { bg: "#ECFDF5", text: "#047857" },
  Rejected: { bg: "#FEF2F2", text: "#B91C1C" },
  Cancelled: { bg: "#F3F4F6", text: "#374151" },
};
