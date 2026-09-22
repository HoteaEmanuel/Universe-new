import { View, Text, Image } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Logo1 from "../../assets/logo_1.png";
import { authPalette } from "./authPalette";

type AuthHeroHeaderProps = {
  tagline: string;
};

// The gradient band + logo/wordmark lockup shared by the login and signup
// screens. Uniwind doesn't translate CSS gradients for React Native
// (backdropFilter is stubbed to a no-op the same way), so this can't be a
// Uniwind gradient utility class. It's react-native-svg rather than
// expo-linear-gradient deliberately: svg is already a linked native module
// (used by the svg-transformer/vector-icons pipeline), so it renders in the
// dev client already installed on-device, where a freshly added
// expo-linear-gradient would need a native rebuild first
// (`ExpoLinearGradient` view-config warning) before it renders at all. The
// gradient rect sits behind the content, clipped to the View's own rounded
// bottom corners via overflow: hidden — SVG's own rx/ry round every corner
// uniformly, so per-corner rounding has to come from the RN View, not the
// shape.
const AuthHeroHeader = ({ tagline }: AuthHeroHeaderProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        height: 296 + insets.top,
        paddingTop: Math.max(44, insets.top + 12),
        paddingBottom: 20,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 44,
        borderBottomRightRadius: 44,
        overflow: "hidden",
      }}
    >
      <Svg
        width="100%"
        height="100%"
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <Defs>
          <LinearGradient id="heroGradient" x1="10%" y1="0%" x2="75%" y2="100%">
            <Stop offset="0%" stopColor={authPalette.heroGradient[0]} />
            <Stop offset="48%" stopColor={authPalette.heroGradient[1]} />
            <Stop offset="100%" stopColor={authPalette.heroGradient[2]} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#heroGradient)" />
      </Svg>

      <View className="flex-1 items-center justify-center gap-2.5">
        <View className="flex-row items-center gap-3">
          <View
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <Image source={Logo1} style={{ width: 50, height: 50 }} resizeMode="contain" />
          </View>
          <Text className="font-kaushan text-4xl text-white" style={{ lineHeight: 40 }}>
            Universe
          </Text>
        </View>
        <Text className="text-sm font-medium text-white/90" style={{ letterSpacing: 0.3 }}>
          {tagline}
        </Text>
      </View>
    </View>
  );
};

export default AuthHeroHeader;
