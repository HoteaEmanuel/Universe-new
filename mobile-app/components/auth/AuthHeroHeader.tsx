import { View, Text, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Logo1 from "../../assets/logo_1.png";
import { authPalette } from "./authPalette";

type AuthHeroHeaderProps = {
  tagline: string;
};

// The gradient band + logo/wordmark lockup shared by the login and signup
// screens. Uniwind doesn't translate CSS gradients for React Native
// (backdropFilter is stubbed to a no-op the same way), so this is
// expo-linear-gradient rather than a Uniwind gradient utility class.
const AuthHeroHeader = ({ tagline }: AuthHeroHeaderProps) => {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={authPalette.heroGradient}
      locations={authPalette.heroGradientLocations}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.75, y: 1 }}
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
    </LinearGradient>
  );
};

export default AuthHeroHeader;
