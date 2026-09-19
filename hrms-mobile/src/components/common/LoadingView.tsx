import * as React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { colors } from "../../constants/colors";

export function LoadingView({ label }: { label?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} size="large" />
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.empty}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 32, alignItems: "center", justifyContent: "center", gap: 8 },
  label: { color: colors.muted, fontSize: 13 },
  empty: { color: colors.muted, fontSize: 14, textAlign: "center" },
});
