import * as React from "react";
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { parseApiError } from "../../src/api/errors";
import {
  LEAVE_STATUS_LABEL,
  leaveService,
  type LeaveBalance,
  type LeaveRecord,
  type LeaveTypeOption,
} from "../../src/api/leave.service";
import { Banner } from "../../src/components/common/Banner";
import { Button } from "../../src/components/common/Button";
import { Card } from "../../src/components/common/Card";
import { EmptyState, LoadingView } from "../../src/components/common/LoadingView";
import { StatusPill } from "../../src/components/common/StatusPill";
import { colors } from "../../src/constants/colors";
import { formatDate, formatDateTime, toApiDate } from "../../src/utils/dateFormat";

const EMPTY_FORM = { leave_type: "", start_date: "", end_date: "", reason: "" };

const daysLabel = (n: string | number) => `${Number(n)} ${Number(n) === 1 ? "day" : "days"}`;

export default function LeaveScreen() {
  const [records, setRecords] = React.useState<LeaveRecord[]>([]);
  const [balance, setBalance] = React.useState<LeaveBalance | null>(null);
  const [types, setTypes] = React.useState<LeaveTypeOption[]>([]);
  const [profileMissing, setProfileMissing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  const [detail, setDetail] = React.useState<LeaveRecord | null>(null);
  const [cancellingId, setCancellingId] = React.useState<number | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const typeName = React.useMemo(() => new Map(types.map((t) => [t.code, t.name])), [types]);

  const load = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setLoadError(null);
    try {
      const [list, bal, typeList] = await Promise.all([
        leaveService.list({ per_page: 50 }),
        leaveService.balance(),
        leaveService.types(),
      ]);
      setRecords(list.data);
      setBalance(bal);
      setTypes(typeList);
      setProfileMissing(false);
    } catch (err) {
      const info = parseApiError(err, "Failed to load leave.");
      if (info.status === 404) setProfileMissing(true);
      else setLoadError(info.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    load(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [load]);

  const set = (field: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const openForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setFormError("");
    setIsModalOpen(true);
  };

  const submit = async () => {
    if (isSaving) return;
    setFormError("");

    const start = toApiDate(form.start_date);
    const end = toApiDate(form.end_date);
    const next: Record<string, string> = {};
    if (!form.leave_type) next.leave_type = "Select a leave type.";
    if (!start) next.start_date = "Enter a valid date as YYYY-MM-DD.";
    if (!end) next.end_date = "Enter a valid date as YYYY-MM-DD.";
    if (start && end && end < start) next.end_date = "To date cannot be before the from date.";
    if (!form.reason.trim()) next.reason = "Please provide a reason for the leave.";
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setIsSaving(true);
    try {
      await leaveService.apply({
        leave_type: form.leave_type,
        start_date: start as string,
        end_date: end as string,
        reason: form.reason.trim(),
      });
      setIsModalOpen(false);
      setNotice("Leave request submitted.");
      load();
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err, "Could not submit the leave request.");
      const onField = ["leave_type", "start_date", "end_date", "reason"].some((k) => fieldErrors[k]);
      if (onField) setErrors(fieldErrors);
      else setFormError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const cancel = async (id: number) => {
    setCancellingId(id);
    setActionError(null);
    try {
      await leaveService.cancel(id);
      setDetail(null);
      setNotice("Leave request cancelled.");
      await load();
    } catch (err) {
      setActionError(parseApiError(err, "Could not cancel this request.").message);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Leave
        </Text>
        {!profileMissing && <Button title="Apply" onPress={openForm} accessibilityLabel="Apply for leave" />}
      </View>

      {isLoading ? (
        <LoadingView label="Loading leave..." />
      ) : profileMissing ? (
        <View style={{ padding: 16 }}>
          <EmptyState message="No employee profile is linked to your account. Contact HR to use leave." />
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} />}
          ListHeaderComponent={
            <View style={{ gap: 10, marginBottom: 6 }}>
              {loadError && <Banner type="error" message={loadError} />}
              {notice && <Banner type="success" message={notice} />}
              <Text style={styles.section}>Balance{balance ? ` — ${balance.year}` : ""}</Text>
              {balance?.types.map((t) => (
                <Card key={t.leave_type}>
                  <Text style={styles.cardTitle}>{t.name}</Text>
                  <View style={styles.balanceRow}>
                    <View>
                      <Text style={styles.metricLabel}>Approved</Text>
                      <Text style={styles.metric}>{t.used}</Text>
                    </View>
                    <View>
                      <Text style={styles.metricLabel}>Pending</Text>
                      <Text style={styles.metric}>{t.pending}</Text>
                    </View>
                    <View>
                      <Text style={styles.metricLabel}>Entitlement</Text>
                      <Text style={t.allocated === null ? styles.hint : styles.metric}>
                        {t.allocated === null ? "Not configured" : t.allocated}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.metricLabel}>Remaining</Text>
                      <Text style={t.available === null ? styles.hint : styles.metric}>
                        {t.available === null ? "Not configured" : t.available}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
              {balance && !balance.allocation_configured && (
                <Text style={styles.hint}>
                  No leave entitlement is configured for you this year, so the remaining balance cannot be shown. Contact HR
                  before applying for leave.
                </Text>
              )}
              <Text style={[styles.section, { marginTop: 8 }]}>My requests</Text>
            </View>
          }
          ListEmptyComponent={<EmptyState message="No leave requests yet." />}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Leave ${formatDate(item.start_date)} to ${formatDate(item.end_date)}, ${
                LEAVE_STATUS_LABEL[item.status]
              }. Open details`}
              onPress={() => {
                setActionError(null);
                setDetail(item);
              }}
            >
              <Card>
                <View style={styles.rowTop}>
                  <Text style={styles.date}>
                    {formatDate(item.start_date)} – {formatDate(item.end_date)}
                  </Text>
                  <StatusPill status={LEAVE_STATUS_LABEL[item.status]} />
                </View>
                <Text style={styles.meta}>
                  {typeName.get(item.leave_type) ?? item.leave_type} · {daysLabel(item.total_days)}
                </Text>
                {item.reason ? (
                  <Text style={styles.reason} numberOfLines={2}>
                    {item.reason}
                  </Text>
                ) : null}
              </Card>
            </Pressable>
          )}
        />
      )}

      <Modal visible={isModalOpen} animationType="slide" transparent onRequestClose={() => setIsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView contentContainerStyle={{ gap: 12 }} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle} accessibilityRole="header">
                Apply for leave
              </Text>
              {formError ? <Banner type="error" message={formError} /> : null}

              <View style={{ gap: 6 }}>
                <Text style={styles.label}>Leave type</Text>
                <View style={styles.chips}>
                  {types.map((t) => {
                    const active = form.leave_type === t.code;
                    return (
                      <Pressable
                        key={t.code}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: active }}
                        onPress={() => set("leave_type", t.code)}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{t.name}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                {errors.leave_type ? <Text style={styles.errorText}>{errors.leave_type}</Text> : null}
              </View>

              <Field
                label="From date (YYYY-MM-DD)"
                value={form.start_date}
                onChangeText={(v) => set("start_date", v)}
                error={errors.start_date}
                placeholder="2026-10-05"
              />
              <Field
                label="To date (YYYY-MM-DD)"
                value={form.end_date}
                onChangeText={(v) => set("end_date", v)}
                error={errors.end_date}
                placeholder="2026-10-07"
              />
              <Field
                label="Reason"
                value={form.reason}
                onChangeText={(v) => set("reason", v)}
                error={errors.reason}
                placeholder="Reason for leave"
                multiline
              />
              <Text style={styles.hint}>The number of days is calculated when you submit; weekly offs are not counted.</Text>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                <Button title="Cancel" variant="outline" onPress={() => setIsModalOpen(false)} disabled={isSaving} style={{ flex: 1 }} />
                <Button title="Submit" onPress={submit} isLoading={isSaving} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={!!detail} animationType="slide" transparent onRequestClose={() => setDetail(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {detail && (
              <ScrollView contentContainerStyle={{ gap: 10 }}>
                <Text style={styles.modalTitle} accessibilityRole="header">
                  Leave details
                </Text>
                {actionError ? <Banner type="error" message={actionError} /> : null}
                <StatusPill status={LEAVE_STATUS_LABEL[detail.status]} />
                <Detail label="Type" value={typeName.get(detail.leave_type) ?? detail.leave_type} />
                <Detail label="From" value={formatDate(detail.start_date)} />
                <Detail label="To" value={formatDate(detail.end_date)} />
                <Detail label="Days" value={daysLabel(detail.total_days)} />
                <Detail label="Reason" value={detail.reason ?? "-"} />
                <Detail label="Applied" value={formatDateTime(detail.created_at)} />
                {detail.approved_at ? (
                  <Detail
                    label={detail.status === "rejected" ? "Rejected" : "Approved"}
                    value={`${detail.approver ? `${detail.approver.name}, ` : ""}${formatDateTime(detail.approved_at)}`}
                  />
                ) : null}
                {detail.status === "rejected" && detail.rejection_reason ? (
                  <Detail label="Reviewer remarks" value={detail.rejection_reason} />
                ) : null}

                <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                  <Button title="Close" variant="outline" onPress={() => setDetail(null)} style={{ flex: 1 }} />
                  {detail.status === "pending" && (
                    <Button
                      title="Cancel request"
                      variant="destructive"
                      isLoading={cancellingId === detail.id}
                      onPress={() => cancel(detail.id)}
                      style={{ flex: 1 }}
                    />
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        style={[styles.input, multiline && styles.inputMulti, error ? styles.inputError : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        maxLength={multiline ? 500 : 10}
        autoCapitalize="none"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: "700", color: colors.ink },
  list: { padding: 16, gap: 10 },
  section: { fontSize: 15, fontWeight: "700", color: colors.ink },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.ink },
  balanceRow: { flexDirection: "row", gap: 28, marginTop: 8 },
  metricLabel: { fontSize: 12, color: colors.muted },
  metric: { fontSize: 22, fontWeight: "700", color: colors.ink },
  hint: { fontSize: 12, color: colors.muted },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  date: { fontSize: 14, fontWeight: "700", color: colors.ink, flexShrink: 1 },
  meta: { fontSize: 13, color: colors.inkSoft, marginTop: 6 },
  reason: { fontSize: 13, color: colors.inkSoft, marginTop: 4 },
  detailValue: { fontSize: 14, color: colors.ink },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "88%" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.ink },
  label: { fontSize: 13, fontWeight: "600", color: colors.inkSoft },
  input: { minHeight: 46, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, paddingHorizontal: 12, fontSize: 14, color: colors.ink },
  inputMulti: { minHeight: 84, textAlignVertical: "top", paddingTop: 10 },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { minHeight: 44, justifyContent: "center", paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.inkSoft },
  chipTextActive: { color: colors.primaryDark, fontWeight: "700" },
});
