import { formatDate, toApiDate, toApiDateTime } from "../../src/utils/dateFormat";
import * as React from "react";
import {
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { parseApiError } from "../../src/api/errors";
import { regularizationService } from "../../src/api/regularization.service";
import { Banner } from "../../src/components/common/Banner";
import { Button } from "../../src/components/common/Button";
import { Card } from "../../src/components/common/Card";
import { EmptyState, LoadingView } from "../../src/components/common/LoadingView";
import { StatusPill } from "../../src/components/common/StatusPill";
import { colors } from "../../src/constants/colors";
import type { RegularizationRecord } from "../../src/attendance/attendance.types";

const EMPTY_FORM = {
  attendance_date: "",
  requested_check_in: "",
  requested_check_out: "",
  reason: "",
  description: "",
};

export default function RegularizationScreen() {
  const [records, setRecords] = React.useState<RegularizationRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(EMPTY_FORM);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [cancellingId, setCancellingId] = React.useState<number | null>(null);

  const load = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setLoadError(null);
    try {
      const result = await regularizationService.list();
      setRecords(result.data);
    } catch (err) {
      setLoadError(parseApiError(err, "Failed to load regularizations.").message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    load(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [load]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async () => {
    if (isSaving) return;
    setFormError("");
    setErrors({});

    // Validate and normalize to the exact API formats (payload format unchanged).
    const date = toApiDate(formData.attendance_date);
    const checkIn = formData.requested_check_in.trim() ? toApiDateTime(formData.requested_check_in) : null;
    const checkOut = formData.requested_check_out.trim() ? toApiDateTime(formData.requested_check_out) : null;
    const nextErrors: Record<string, string> = {};
    if (!date) nextErrors.attendance_date = "Enter a valid date as YYYY-MM-DD.";
    if (formData.requested_check_in.trim() && !checkIn)
      nextErrors.requested_check_in = "Enter a valid date and time as YYYY-MM-DD HH:mm (24-hour).";
    if (formData.requested_check_out.trim() && !checkOut)
      nextErrors.requested_check_out = "Enter a valid date and time as YYYY-MM-DD HH:mm (24-hour).";
    if (!formData.requested_check_in.trim() && !formData.requested_check_out.trim())
      nextErrors.requested_check_in = "Provide a requested check-in or check-out time.";
    if (checkIn && checkOut && checkOut < checkIn)
      nextErrors.requested_check_out = "Check-out must be after check-in.";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSaving(true);
    try {
      await regularizationService.create({
        attendance_date: date as string,
        requested_check_in: checkIn ?? undefined,
        requested_check_out: checkOut ?? undefined,
        reason: formData.reason,
        description: formData.description || undefined,
      });
      setIsModalOpen(false);
      setFormData(EMPTY_FORM);
      load();
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err, "Failed to submit regularization.");
      if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
      else setFormError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async (id: number) => {
    setCancellingId(id);
    try {
      await regularizationService.cancel(id);
      await load();
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Regularization</Text>
        <Button title="Request" onPress={() => setIsModalOpen(true)} />
      </View>

      {isLoading ? (
        <LoadingView label="Loading requests..." />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} />}
          ListHeaderComponent={loadError ? <Banner type="error" message={loadError} /> : null}
          ListEmptyComponent={<EmptyState message="No regularization requests yet." />}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.rowTop}>
                <Text style={styles.date}>{formatDate(item.attendance_date)}</Text>
                <StatusPill status={item.status} />
              </View>
              <Text style={styles.reason}>{item.reason}</Text>
              {item.status === "Pending" && (
                <Button
                  title="Cancel Request"
                  variant="outline"
                  isLoading={cancellingId === item.id}
                  onPress={() => handleCancel(item.id)}
                  style={{ marginTop: 10 }}
                />
              )}
            </Card>
          )}
        />
      )}

      <Modal visible={isModalOpen} animationType="slide" transparent onRequestClose={() => setIsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView contentContainerStyle={{ gap: 12 }} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>Request Regularization</Text>
              {formError && <Banner type="error" message={formError} />}

              <Field
                label="Attendance Date (YYYY-MM-DD)"
                value={formData.attendance_date}
                onChangeText={(v) => handleChange("attendance_date", v)}
                error={errors.attendance_date}
                placeholder="2026-09-17"
              />
              <Field
                label="Requested Check-In (YYYY-MM-DD HH:mm)"
                value={formData.requested_check_in}
                onChangeText={(v) => handleChange("requested_check_in", v)}
                error={errors.requested_check_in}
                placeholder="2026-09-17 09:00:00"
              />
              <Field
                label="Requested Check-Out (YYYY-MM-DD HH:mm)"
                value={formData.requested_check_out}
                onChangeText={(v) => handleChange("requested_check_out", v)}
                error={errors.requested_check_out}
                placeholder="2026-09-17 18:00:00"
              />
              <Field
                label="Reason"
                value={formData.reason}
                onChangeText={(v) => handleChange("reason", v)}
                error={errors.reason}
                placeholder="e.g. Forgot to check in"
              />

              <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  style={{ flex: 1 }}
                />
                <Button title="Submit" onPress={handleSubmit} isLoading={isSaving} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  error,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  placeholder?: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: "700", color: colors.ink },
  list: { padding: 16, gap: 10 },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  date: { fontSize: 14, fontWeight: "700", color: colors.ink },
  reason: { fontSize: 13, color: colors.inkSoft, marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "85%" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.ink },
  label: { fontSize: 13, fontWeight: "600", color: colors.inkSoft },
  input: { height: 46, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, paddingHorizontal: 12, fontSize: 14, color: colors.ink },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 12 },
});
