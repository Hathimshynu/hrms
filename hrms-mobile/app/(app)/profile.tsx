import { useRouter } from "expo-router";
import * as React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../src/auth/AuthProvider";
import { Button } from "../../src/components/common/Button";
import { Card } from "../../src/components/common/Card";
import { colors } from "../../src/constants/colors";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.content}>
        <Card>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) ?? "?"}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          {user?.roles && user.roles.length > 0 && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user.roles.join(", ")}</Text>
            </View>
          )}
        </Card>

        <Button
          title="Change Password"
          variant="outline"
          onPress={() => router.push("/change-password")}
          style={{ marginTop: 16 }}
        />
        <Button title="Sign Out" variant="destructive" onPress={logout} style={{ marginTop: 10 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: "700", color: colors.ink, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  content: { padding: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 12 },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "700" },
  name: { fontSize: 17, fontWeight: "700", color: colors.ink, textAlign: "center" },
  email: { fontSize: 13, color: colors.muted, textAlign: "center", marginTop: 2 },
  roleBadge: { alignSelf: "center", backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, marginTop: 10 },
  roleText: { color: colors.primary, fontSize: 12, fontWeight: "600" },
});
