import * as React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../constants/colors";

interface BannerProps {
  type: "success" | "error";
  message: string;
}

export function Banner({ type, message }: BannerProps) {
  const isSuccess = type === "success";
  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: isSuccess ? colors.successSoft : colors.dangerSoft },
      ]}
    >
      <Text style={{ color: isSuccess ? colors.success : colors.danger, fontSize: 13, fontWeight: "500" }}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
