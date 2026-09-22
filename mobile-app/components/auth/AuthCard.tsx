import { View, StyleSheet, type ViewProps } from "react-native";
import { BlurView } from "expo-blur";
import { authPalette } from "./authPalette";

// The glass panel below the hero. A real backdrop blur (matching the
// approved mockup) needs expo-blur's BlurView — Uniwind's own
// `backdropFilter` is stubbed to a no-op for React Native, there's no
// pure-style equivalent. The outer View keeps overflow: hidden so the
// BlurView (and the tint on top of it) are clipped to the rounded corners;
// unlike the hero's SVG shape, BlurView is a real RN-managed native view,
// so it clips correctly through the parent's own overflow + borderRadius.
const AuthCard = ({ style, children, ...props }: ViewProps) => {
  return (
    <View
      style={[
        {
          marginTop: -36,
          marginHorizontal: 24,
          borderRadius: 28,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: authPalette.cardBorder,
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
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View
        style={{
          backgroundColor: authPalette.cardBg,
          padding: 22,
          paddingTop: 28,
          gap: 16,
        }}
      >
        {children}
      </View>
    </View>
  );
};

export default AuthCard;
