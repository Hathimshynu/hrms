import { formatTime, getMonthKeyIST } from "../../src/utils/dateFormat";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as React from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { attendanceService } from "../../src/api/attendance.service";
import { useAuth } from "../../src/auth/AuthProvider";
import { Banner } from "../../src/components/common/Banner";
import { Button } from "../../src/components/common/Button";
import { Card } from "../../src/components/common/Card";
import { LoadingView } from "../../src/components/common/LoadingView";
import { parseApiError } from "../../src/api/errors";
import { GeolocationError, getCurrentPosition } from "../../src/hooks/useGeolocation";
import { colors } from "../../src/constants/colors";
import type { AttendanceRecord, TimesheetResponse } from "../../src/attendance/attendance.types";

export default function AttendanceHomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [today, setToday] = React.useState<AttendanceRecord | null>(null);
  const [timesheet, setTimesheet] = React.useState<TimesheetResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);

  const load = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setLoadError(null);
    try {
      const [todayResult, timesheetResult] = await Promise.all([
        attendanceService.today(),
        attendanceService.timesheet(getMonthKeyIST()),
      ]);
      setToday(todayResult);
      setTimesheet(timesheetResult);
    } catch (err) {
      setLoadError(parseApiError(err, "Failed to load attendance.").message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    load(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [load]);

  const runAction = async (action: "checkIn" | "checkOut") => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const position = await getCurrentPosition();
      const result = await (action === "checkIn"
        ? attendanceService.checkIn({
            latitude: position.latitude,
            longitude: position.longitude,
            accuracy: position.accuracy ?? undefined,
          })
        : attendanceService.checkOut({
            latitude: position.latitude,
            longitude: position.longitude,
            accuracy: position.accuracy ?? undefined,
          }));
      setToday(result.data);
      setActionSuccess(result.message ?? null);
      load(true);
    } catch (err) {
      if (err instanceof GeolocationError) {
        setActionError(err.message);
      } else {
        setActionError(parseApiError(err, `${action === "checkIn" ? "Check-in" : "Check-out"} failed.`).message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasCheckedIn = !!today?.check_in_at;
  const hasCheckedOut = !!today?.check_out_at;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(" ")[0] ?? "there"}</Text>
          <Text style={styles.headerTitle}>My Attendance</Text>
        </View>
        <Button title="Sign out" variant="ghost" onPress={logout} />
      </View>

      {isLoading ? (
        <LoadingView label="Loading attendance..." />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} />}
        >
          {loadError && <Banner type="error" message={loadError} />}

          <Card>
            <View style={styles.statusRow}>
              <Text style={styles.cardTitle}>Today</Text>
              {today?.status && (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{today.status}</Text>
                </View>
              )}
            </View>

            <View style={styles.timeRow}>
              <View style={styles.timeBlock}>
                <Ionicons name="log-in-outline" size={18} color={colors.success} />
                <Text style={styles.timeLabel}>Check In</Text>
                <Text style={styles.timeValue}>{formatTime(today?.check_in_at ?? null)}</Text>
              </View>
              <View style={styles.timeBlock}>
                <Ionicons name="log-out-outline" size={18} color={colors.info} />
                <Text style={styles.timeLabel}>Check Out</Text>
                <Text style={styles.timeValue}>{formatTime(today?.check_out_at ?? null)}</Text>
              </View>
              <View style={styles.timeBlock}>
                <Ionicons name="hourglass-outline" size={18} color={colors.primary} />
                <Text style={styles.timeLabel}>Work Hours</Text>
                <Text style={styles.timeValue}>{today?.work_hours ?? "--"}</Text>
              </View>
            </View>

            {today?.overtime_hours && Number(today.overtime_hours) > 0 && (
              <View style={styles.overtimeBadge}>
                <Ionicons name="flash-outline" size={14} color={colors.warning} />
                <Text style={styles.overtimeText}>+{today.overtime_hours}h overtime</Text>
              </View>
            )}

            {actionError && <Banner type="error" message={actionError} />}
            {actionSuccess && <Banner type="success" message={actionSuccess} />}

            {!hasCheckedIn && (
              <Button title="Check In" onPress={() => runAction("checkIn")} isLoading={isSubmitting} style={{ marginTop: 12 }} />
            )}
            {hasCheckedIn && !hasCheckedOut && (
              <Button
                title="Check Out"
                variant="destructive"
                onPress={() => runAction("checkOut")}
                isLoading={isSubmitting}
                style={{ marginTop: 12 }}
              />
            )}
            {hasCheckedIn && hasCheckedOut && (
              <View style={styles.completedRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.completedText}>Attendance completed for today</Text>
              </View>
            )}
          </Card>

          {timesheet && (
            <Card style={{ marginTop: 12 }}>
              <Text style={styles.cardTitle}>This Month</Text>
              <View style={styles.statsGrid}>
                <Stat label="Present" value={timesheet.present_days} color={colors.success} />
                <Stat label="Late" value={timesheet.late_days} color={colors.warning} />
                <Stat label="Half Day" value={timesheet.half_days} color={colors.info} />
                <Stat label="On Leave" value={timesheet.leave_days} color={colors.danger} />
              </View>
              <View style={styles.hoursRow}>
                <Text style={styles.hoursLabel}>Total Hours: <Text style={styles.hoursValue}>{timesheet.total_work_hours}h</Text></Text>
                <Text style={styles.hoursLabel}>Overtime: <Text style={styles.hoursValue}>{timesheet.total_overtime_hours}h</Text></Text>
              </View>
            </Card>
          )}

          <Button
            title="Request Regularization"
            variant="outline"
            onPress={() => router.push("/(app)/regularization")}
            style={{ marginTop: 12 }}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  greeting: { fontSize: 13, color: colors.muted },
  headerTitle: { fontSize: 22, fontWeight: "700", color: colors.ink },
  scroll: { padding: 16, paddingBottom: 32 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.ink },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  statusBadge: { backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { color: colors.primary, fontSize: 12, fontWeight: "600" },
  timeRow: { flexDirection: "row", justifyContent: "space-between" },
  timeBlock: { alignItems: "center", gap: 4, flex: 1 },
  timeLabel: { fontSize: 11, color: colors.muted },
  timeValue: { fontSize: 14, fontWeight: "700", color: colors.ink },
  overtimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "center",
    marginTop: 10,
    backgroundColor: colors.warningSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  overtimeText: { color: colors.warning, fontSize: 12, fontWeight: "600" },
  completedRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, backgroundColor: colors.successSoft, paddingVertical: 10, borderRadius: 10 },
  completedText: { color: colors.success, fontSize: 13, fontWeight: "600" },
  statsGrid: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  statItem: { alignItems: "center", gap: 2 },
  statValue: { fontSize: 20, fontWeight: "700" },
  statLabel: { fontSize: 11, color: colors.muted },
  hoursRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  hoursLabel: { fontSize: 12, color: colors.muted },
  hoursValue: { color: colors.ink, fontWeight: "700" },
});
