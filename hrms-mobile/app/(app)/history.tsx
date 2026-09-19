import { formatDate, formatTime } from "../../src/utils/dateFormat";
import * as React from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { attendanceService } from "../../src/api/attendance.service";
import { parseApiError } from "../../src/api/errors";
import { Banner } from "../../src/components/common/Banner";
import { Card } from "../../src/components/common/Card";
import { EmptyState, LoadingView } from "../../src/components/common/LoadingView";
import { StatusPill } from "../../src/components/common/StatusPill";
import { colors } from "../../src/constants/colors";
import type { AttendanceRecord } from "../../src/attendance/attendance.types";

const PAGE_SIZE = 15;

export default function HistoryScreen() {
  const [records, setRecords] = React.useState<AttendanceRecord[]>([]);
  const [page, setPage] = React.useState(1);
  const [lastPage, setLastPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const loadPage = React.useCallback(async (targetPage: number, mode: "initial" | "refresh" | "more") => {
    if (mode === "initial") setIsLoading(true);
    if (mode === "refresh") setIsRefreshing(true);
    if (mode === "more") setIsLoadingMore(true);
    setLoadError(null);
    try {
      const result = await attendanceService.history({ page: targetPage, per_page: PAGE_SIZE });
      setRecords((prev) => (targetPage === 1 ? result.data : [...prev, ...result.data]));
      setPage(result.current_page);
      setLastPage(result.last_page);
    } catch (err) {
      setLoadError(parseApiError(err, "Failed to load attendance history.").message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, []);

  React.useEffect(() => {
    loadPage(1, "initial"); // eslint-disable-line react-hooks/set-state-in-effect
  }, [loadPage]);

  const handleEndReached = () => {
    if (!isLoadingMore && page < lastPage) {
      loadPage(page + 1, "more");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Text style={styles.title}>Attendance History</Text>

      {isLoading ? (
        <LoadingView label="Loading history..." />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => loadPage(1, "refresh")} />
          }
          onEndReachedThreshold={0.4}
          onEndReached={handleEndReached}
          ListHeaderComponent={loadError ? <Banner type="error" message={loadError} /> : null}
          ListEmptyComponent={<EmptyState message="No attendance history found." />}
          ListFooterComponent={isLoadingMore ? <LoadingView /> : null}
          renderItem={({ item }) => (
            <Card style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.date}>{formatDate(item.attendance_date)}</Text>
                <Text style={styles.times}>
                  {item.check_in_at ? formatTime(item.check_in_at) : "--"} →{" "}
                  {item.check_out_at ? formatTime(item.check_out_at) : "--"}
                  {item.work_hours ? `  ·  ${item.work_hours}h` : ""}
                </Text>
              </View>
              <StatusPill status={item.status} />
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: "700", color: colors.ink, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  list: { padding: 16, gap: 10 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  date: { fontSize: 14, fontWeight: "600", color: colors.ink },
  times: { fontSize: 12, color: colors.muted, marginTop: 2 },
});
