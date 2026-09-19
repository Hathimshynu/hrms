import * as React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors } from "../../constants/colors";

type Variant = "primary" | "outline" | "destructive" | "ghost";

interface ButtonProps extends Omit<PressableProps, "style"> {
  title: string;
  variant?: Variant;
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  variant = "primary",
  isLoading = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === "outline" || variant === "ghost" ? colors.primary : "#fff"} />
      ) : (
        <Text style={[styles.text, textVariantStyles[variant]]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  text: { fontSize: 15, fontWeight: "600" },
});

const variantStyles: Record<Variant, StyleProp<ViewStyle>> = {
  primary: { backgroundColor: colors.primary },
  destructive: { backgroundColor: colors.danger },
  outline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: "transparent" },
};

const textVariantStyles: Record<Variant, StyleProp<ViewStyle>> = {
  primary: { color: "#fff" } as never,
  destructive: { color: "#fff" } as never,
  outline: { color: colors.ink } as never,
  ghost: { color: colors.primary } as never,
};
