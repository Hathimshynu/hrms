import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../src/auth/AuthProvider";
import { Banner } from "../src/components/common/Banner";
import { Button } from "../src/components/common/Button";
import { colors } from "../src/constants/colors";

export default function LoginScreen() {
  const { login, isLoggingIn, error } = useAuth();
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [fieldError, setFieldError] = React.useState("");

  const handleSubmit = async () => {
    setFieldError("");

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setFieldError("Enter a valid email address");
      return;
    }
    if (password.length < 6) {
      setFieldError("Password must be at least 6 characters");
      return;
    }

    try {
      const user = await login({ email: email.trim(), password, remember_me: rememberMe });
      router.replace(user.must_change_password ? "/change-password" : "/(app)");
    } catch {
      // error already surfaced via useAuth().error
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <Image
              source={require("../assets/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your HRMS account</Text>

          {(fieldError || error) && <Banner type="error" message={fieldError || error || ""} />}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!isLoggingIn}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoggingIn}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={10}
                style={styles.eyeButton}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={colors.inkSoft}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.rememberRow}>
            <Switch value={rememberMe} onValueChange={setRememberMe} disabled={isLoggingIn} />
            <Text style={styles.rememberLabel}>Remember me</Text>
          </View>

          <Button
            title={isLoggingIn ? "Signing in..." : "Sign In"}
            onPress={handleSubmit}
            isLoading={isLoggingIn}
            style={{ marginTop: 8 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 14 },
  logoWrap: { alignItems: "center", marginBottom: 8 },
  logo: { width: 72, height: 72, borderRadius: 16 },
  title: { fontSize: 24, fontWeight: "700", color: colors.ink, textAlign: "center" },
  subtitle: { fontSize: 14, color: colors.inkSoft, textAlign: "center", marginBottom: 8 },
  field: { gap: 6 },
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
  passwordWrap: { justifyContent: "center" },
  passwordInput: { paddingRight: 46 },
  eyeButton: { position: "absolute", right: 14, height: 48, justifyContent: "center" },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rememberLabel: { fontSize: 14, color: colors.inkSoft },
});
