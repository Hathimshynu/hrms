import * as React from "react";
import { StyleSheet, Text, View } from "react-native";

import { statusColors } from "../../constants/colors";

export function StatusPill({ status }: { status: string }) {
  const style = statusColors[status] ?? { bg: "#F3F4F6", text: "#374151" };

  return (
    <View style={[styles.pill, { backgroundColor: style.bg }]}>
      <View style={[styles.dot, { backgroundColor: style.text }]} />
      <Text style={[styles.text, { color: style.text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, fontWeight: "600" },
});
