import { Redirect } from "expo-router";
import { View } from "react-native";

import { useAuth } from "../src/auth/AuthProvider";
import { LoadingView } from "../src/components/common/LoadingView";
import { colors } from "../src/constants/colors";

export default function Index() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center" }}>
        <LoadingView label="Loading..." />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? "/(app)" : "/login"} />;
}
