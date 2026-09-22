import { View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale } from "../../lib/styled";
import { authPalette } from "./authPalette";

type GoogleButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
};

const GoogleButton = ({ label, onPress, loading }: GoogleButtonProps) => {
  return (
    <PressableScale
      onPress={onPress}
      enabled={!loading}
      accessibilityRole="button"
      style={{
        height: 50,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: authPalette.googleBorder,
        backgroundColor: authPalette.googleBg,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={authPalette.textPrimary} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Ionicons name="logo-google" size={18} color={authPalette.textPrimary} />
          <Text style={{ color: authPalette.textPrimary, fontSize: 14, fontWeight: "500" }}>
            {label}
          </Text>
        </View>
      )}
    </PressableScale>
  );
};

export default GoogleButton;
