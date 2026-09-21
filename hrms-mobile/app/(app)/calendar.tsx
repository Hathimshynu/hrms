import { Ionicons } from "@expo/vector-icons";
import * as React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { attendanceService } from "../../src/api/attendance.service";
import { parseApiError } from "../../src/api/errors";
import { Banner } from "../../src/components/common/Banner";
import { AbsenceSummaryCard } from "../../src/components/common/AbsenceSummaryCard";
import { LoadingView } from "../../src/components/common/LoadingView";
import { colors, statusColors } from "../../src/constants/colors";
import type { AttendanceStatus } from "../../src/attendance/attendance.types";
import { getTodayIST } from "../../src/utils/dateFormat";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function CalendarScreen() {
  // Start on the current Asia/Kolkata month (a plain local first-of-month Date is
  // only used for calendar arithmetic, never for display or timezone math).
  const [cursor, setCursor] = React.useState(() => {
    const [y, m] = getTodayIST().split("-").map(Number);
    return new Date(y, m - 1, 1);
  });
  const [statusByDate, setStatusByDate] = React.useState<Record<string, AttendanceStatus>>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const records = await attendanceService.calendar(monthKey(cursor));
      const map: Record<string, AttendanceStatus> = {};
      records.forEach((r) => {
        if (r.attendance_date) map[r.attendance_date] = r.status;
      });
      setStatusByDate(map);
    } catch (err) {
      setLoadError(parseApiError(err, "Failed to load attendance calendar.").message);
    } finally {
      setIsLoading(false);
    }
  }, [cursor]);

  React.useEffect(() => {
    load(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [load]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = getTodayIST();

  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Text style={styles.title}>Attendance Calendar</Text>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loadError && <Banner type="error" message={loadError} />}

        <View style={styles.monthNav}>
          <Pressable onPress={() => setCursor(new Date(year, month - 1, 1))} hitSlop={10}>
            <Ionicons name="chevron-back" size={20} color={colors.ink} />
          </Pressable>
          <Text style={styles.monthLabel}>{MONTH_NAMES[month]} {year}</Text>
          <Pressable onPress={() => setCursor(new Date(year, month + 1, 1))} hitSlop={10}>
            <Ionicons name="chevron-forward" size={20} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {WEEKDAYS.map((d, i) => (
            <Text key={i} style={styles.weekDay}>{d}</Text>
          ))}
        </View>

        {isLoading ? (
          <LoadingView label="Loading calendar..." />
        ) : (
          <View style={styles.grid}>
            {cells.map((day, idx) => {
              if (day === null) return <View key={idx} style={styles.cell} />;
              const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const status = statusByDate[dateKey];
              const style = status ? statusColors[status] : null;
              const isToday = dateKey === todayKey;

              return (
                <View key={idx} style={styles.cell}>
                  <View
                    style={[
                      styles.dayCircle,
                      isToday && styles.todayCircle,
                      style && { backgroundColor: style.bg },
                    ]}
                  >
                    <Text style={[styles.dayText, isToday && styles.todayText, style && { color: style.text }]}>
                      {day}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.legend}>
          {Object.entries(statusColors)
            .filter(([key]) => ["Present", "Late", "Half Day", "On Leave", "Absent", "Holiday", "Week Off"].includes(key))
            .map(([key, style]) => (
              <View key={key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: style.text }]} />
                <Text style={styles.legendLabel}>{key}</Text>
              </View>
            ))}
        </View>

        <AbsenceSummaryCard year={year} month={month + 1} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: "700", color: colors.ink, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  scroll: { padding: 16, paddingBottom: 32 },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  monthLabel: { fontSize: 16, fontWeight: "700", color: colors.ink },
  weekRow: { flexDirection: "row" },
  weekDay: { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "600", color: colors.muted, marginBottom: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  dayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  todayCircle: { borderWidth: 2, borderColor: colors.primary },
  dayText: { fontSize: 13, color: colors.ink },
  todayText: { fontWeight: "700" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: colors.muted },
});
