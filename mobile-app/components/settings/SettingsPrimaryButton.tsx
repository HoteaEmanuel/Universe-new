import { Text, ActivityIndicator } from "react-native";
import { PressableScale } from "../../lib/styled";
import { Colors } from "../../constants/colors";

type SettingsPrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  danger?: boolean;
};

const SettingsPrimaryButton = ({
  label,
  onPress,
  loading,
  disabled,
  danger,
}: SettingsPrimaryButtonProps) => {
  return (
    <PressableScale
      onPress={onPress}
      enabled={!(disabled || loading)}
      accessibilityRole="button"
      style={{
        height: 50,
        borderRadius: 14,
        backgroundColor: danger ? Colors.warning : Colors.primary,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled || loading ? 0.6 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text className="text-sm font-bold" style={{ color: "#ffffff" }}>
          {label}
        </Text>
      )}
    </PressableScale>
  );
};

export default SettingsPrimaryButton;
