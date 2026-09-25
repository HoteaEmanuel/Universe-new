import { View, Image } from "react-native";
import React from "react";
import ThemedView from "./ThemedView";
import ThemedText from "./ThemedText";
import Logo1 from "../assets/logo_1.png";

// Shown after the native splash hides (fonts are loaded by then, so the
// Kaushan Script wordmark can render here) and until auth/theme are also
// ready - the native config-plugin splash is a static image only and can't
// render text in a custom font.
const AppSplashScreen = () => {
  return (
    <ThemedView className="items-center justify-center h-full" fullHeight>
      <View className="w-40 h-40">
        <Image source={Logo1} className="w-full h-full" resizeMode="contain" />
      </View>
      <ThemedText title={true} className="text-6xl font-kaushan">
        Universe&apos;
      </ThemedText>
    </ThemedView>
  );
};

export default AppSplashScreen;
