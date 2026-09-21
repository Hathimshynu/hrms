import * as React from "react";
import { StyleSheet, Text, View } from "react-native";

import { ABSENCE_LABELS, absenceService, type AbsenceResponse, type AbsenceStatus } from "../../api/absence.service";
import { parseApiError } from "../../api/errors";
import { colors } from "../../constants/colors";
import { formatDate } from "../../utils/dateFormat";
import { Banner } from "./Banner";
import { Card } from "./Card";
import { LoadingView } from "./LoadingView";
import { StatusPill } from "./StatusPill";

const ORDER: AbsenceStatus[] = ["present", "absent", "leave", "weekly_off", "upcoming"];

function lastDay(year: number, month: number): number {
  return new Date(year, month, 0).getDate(); // month is 1-based here
}

// Month absence summary from GET /attendance/absence (derived by the backend
// from attendance, weekly offs and approved leave). Dates are calendar
// strings; nothing goes through the device timezone.
export function AbsenceSummaryCard({ year, month }: { year: number; month: number }) {
  const [data, setData] = React.useState<AbsenceResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    const mm = String(month).padStart(2, "0");
    setIsLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    setError(null);
    absenceService
      .mine({ from_date: `${year}-${mm}-01`, to_date: `${year}-${mm}-${String(lastDay(year, month)).padStart(2, "0")}` })
      .then((res) => active && setData(res))
      .catch((err) => active && setError(parseApiError(err, "Failed to load absence details.").message))
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, [year, month]);

  const flagged = data?.days.filter((d) => d.status === "absent" || d.status === "leave") ?? [];

  return (
    <Card style={{ marginTop: 16, gap: 10 }}>
      <Text style={styles.title} accessibilityRole="header">
        Absence &amp; leave days
      </Text>
      {error ? <Banner type="error" message={error} /> : null}
      {isLoading ? (
        <LoadingView label="Loading absence..." />
      ) : (
        data && (
          <>
            <View style={styles.summary}>
              {ORDER.map((s) => (
                <View key={s} style={styles.metricBox}>
                  <Text style={styles.metric}>{data.summary[s]}</Text>
                  <Text style={styles.metricLabel}>{ABSENCE_LABELS[s]}</Text>
                </View>
              ))}
            </View>
            {flagged.length === 0 ? (
              <Text style={styles.empty}>No absent or leave days this month.</Text>
            ) : (
              flagged.map((d) => (
                <View key={d.date} style={styles.row}>
                  <Text style={styles.date}>{formatDate(d.date)}</Text>
                  <View style={styles.rowRight}>
                    {d.pending_leave ? <Text style={styles.pending}>Leave pending</Text> : null}
                    <StatusPill status={ABSENCE_LABELS[d.status]} />
                  </View>
                </View>
              ))
            )}
          </>
        )
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 15, fontWeight: "700", color: colors.ink },
  summary: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metricBox: { minWidth: 64, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: colors.background },
  metric: { fontSize: 20, fontWeight: "700", color: colors.ink },
  metricLabel: { fontSize: 11, color: colors.muted },
  empty: { fontSize: 13, color: colors.muted },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  date: { fontSize: 14, fontWeight: "600", color: colors.ink },
  pending: { fontSize: 11, color: colors.muted },
});
