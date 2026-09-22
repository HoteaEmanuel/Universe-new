import { View, type ViewProps } from "react-native";
import { authPalette } from "./authPalette";

// The glass panel below the hero. It's a semi-transparent tint, not a true
// blur: Uniwind stubs `backdropFilter` to a no-op for React Native (no
// native equivalent without expo-blur's BlurView), and the approved "clean"
// direction sits on a flat background anyway, so a real blur would have had
// nothing complex behind it to blur.
const AuthCard = ({ style, children, ...props }: ViewProps) => {
  return (
    <View
      style={[
        {
          marginTop: -36,
          marginHorizontal: 24,
          backgroundColor: authPalette.cardBg,
          borderWidth: 1,
          borderColor: authPalette.cardBorder,
          borderRadius: 28,
          padding: 22,
          paddingTop: 28,
          gap: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.5,
          shadowRadius: 30,
          elevation: 12,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

export default AuthCard;
