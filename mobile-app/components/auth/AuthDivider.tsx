import { View, Text } from "react-native";
import { authPalette } from "./authPalette";

const AuthDivider = () => {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: authPalette.divider }} />
      <Text style={{ fontSize: 12, color: authPalette.textMuted }}>or</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: authPalette.divider }} />
    </View>
  );
};

export default AuthDivider;
