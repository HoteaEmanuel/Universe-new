import { View, Image } from "react-native";
import { Redirect, router } from "expo-router";
import ThemedView from "../components/ThemedView";
import ThemedText from "../components/ThemedText";
import Logo1 from "../assets/logo_1.png";
import Spacer from "../components/Spacer";
import { PressableScale } from "../lib/styled";
import { useAuthStore } from "../store/authStore";

const WelcomeScreen = () => {
  const userId = useAuthStore((state) => state.user?.id);
  if (userId != null) {
    return <Redirect href="/(dashboard)/home" />;
  }

  return (
    <ThemedView className="items-center gap-10 h-full" safe={true}>
      {/* <View id="stars" />
        <View id="stars2" />
        <View id="stars3" /> */}
      <View className="items-center w-full ">
        <View className="w-60 h-40">
          <Image source={Logo1} className="w-full h-full" />
        </View>

        <ThemedText title={true} className="text-7xl font-kaushan pr-25">
          Universe&apos;
        </ThemedText>
        <Spacer height={30} />
        <ThemedText className="text-4xl font-bold">
          A platform for all students
        </ThemedText>
        <Spacer height={30} />
        <ThemedText
          title={true}
          className="text-3xl font-semibold font-kaushan pr-25"
        >
          Connect. Discover. Share.
        </ThemedText>
        <Spacer height={100} />
        <PressableScale
          onPress={() => router.push("/(auth)/login")}
          className="bg-violet-900 p-5 rounded-2xl border"
        >
          <ThemedText className="text-white text-2xl font-bold btn-start">
            Get Started
          </ThemedText>
        </PressableScale>
      </View>
    </ThemedView>
  );
};

export default WelcomeScreen;
