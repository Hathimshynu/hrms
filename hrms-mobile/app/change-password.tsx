import { Ionicons } from "@expo/vector-icons";
import { isAxiosError } from "axios";
import { useRouter } from "expo-router";
import * as React from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { authService } from "../src/api/auth.service";
import { useAuth } from "../src/auth/AuthProvider";
import { Banner } from "../src/components/common/Banner";
import { Button } from "../src/components/common/Button";
import { colors } from "../src/constants/colors";

function isStrongEnough(password: string): boolean {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export default function ChangePasswordScreen() {
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    setFormError("");
    const nextErrors: Record<string, string> = {};
    if (!currentPassword) nextErrors.current_password = "Current password is required";
    if (!isStrongEnough(newPassword)) {
      nextErrors.new_password =
        "At least 8 characters, with upper & lower case letters, a number and a symbol.";
    }
    if (newPassword !== confirmPassword) {
      nextErrors.new_password_confirmation = "Passwords do not match";
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });
      await refreshUser();
      router.replace("/(app)");
    } catch (err) {
      if (isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(err)) {
        const data = err.response?.data;
        if (err.response?.status === 422 && data?.errors) {
          const mapped: Record<string, string> = {};
          for (const [key, messages] of Object.entries(data.errors)) {
            mapped[key] = messages[0];
          }
          setFieldErrors(mapped);
        } else {
          setFormError(data?.message ?? "Failed to change password. Please try again.");
        }
      } else {
        setFormError("Failed to change password. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Change password</Text>
        <Text style={styles.subtitle}>
          {user?.must_change_password
            ? "For your security, set a new password to continue."
            : "Update your account password."}
        </Text>

        {formError && <Banner type="error" message={formError} />}

        <Field
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          error={fieldErrors.current_password}
        />
        <Field
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          error={fieldErrors.new_password}
        />
        <Field
          label="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={fieldErrors.new_password_confirmation}
        />

        <Button title="Change password" onPress={handleSubmit} isLoading={isSubmitting} style={{ marginTop: 8 }} />

        {!user?.must_change_password && (
          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => router.back()}
            disabled={isSubmitting}
          />
        )}

        {user?.must_change_password && (
          <Button title="Sign out" variant="ghost" onPress={logout} disabled={isSubmitting} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
}) {
  const [visible, setVisible] = React.useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={{ justifyContent: "center" }}>
        <TextInput
          style={[styles.input, { paddingRight: 46 }, error && styles.inputError]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          onPress={() => setVisible((v) => !v)}
          hitSlop={10}
          style={{ position: "absolute", right: 14, height: 48, justifyContent: "center" }}
          accessibilityRole="button"
          accessibilityLabel={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={22} color={colors.inkSoft} />
        </Pressable>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 14 },
  title: { fontSize: 22, fontWeight: "700", color: colors.ink, textAlign: "center" },
  subtitle: { fontSize: 14, color: colors.inkSoft, textAlign: "center", marginBottom: 8 },
  label: { fontSize: 13, fontWeight: "600", color: colors.inkSoft },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.ink,
  },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 12 },
});
