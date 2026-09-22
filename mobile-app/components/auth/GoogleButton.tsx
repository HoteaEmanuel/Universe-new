import { View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale } from "../../lib/styled";
import { authPalette } from "./authPalette";
import { IconSizes } from "../../constants/iconSizes";

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
          <Ionicons name="logo-google" size={IconSizes.md} color={authPalette.textPrimary} />
          <Text className="text-sm font-medium" style={{ color: authPalette.textPrimary }}>
            {label}
          </Text>
        </View>
      )}
    </PressableScale>
  );
};

export default GoogleButton;
