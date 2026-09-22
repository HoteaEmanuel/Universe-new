import { Text, ActivityIndicator } from "react-native";
import { PressableScale } from "../../lib/styled";
import { authPalette } from "./authPalette";

type AuthPrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

const AuthPrimaryButton = ({ label, onPress, loading, disabled }: AuthPrimaryButtonProps) => {
  return (
    <PressableScale
      onPress={onPress}
      enabled={!(disabled || loading)}
      accessibilityRole="button"
      style={{
        marginTop: 2,
        height: 52,
        borderRadius: 14,
        backgroundColor: authPalette.ctaBg,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled || loading ? 0.7 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={authPalette.ctaText} />
      ) : (
        <Text style={{ color: authPalette.ctaText, fontWeight: "700", fontSize: 15 }}>{label}</Text>
      )}
    </PressableScale>
  );
};

export default AuthPrimaryButton;
