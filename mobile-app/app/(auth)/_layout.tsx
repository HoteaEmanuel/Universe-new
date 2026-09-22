import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import GuestsOnly from "../../components/auth/GuestsOnly";

const AuthLayout = () => {
  return (
    <GuestsOnly>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: "none" }} />
    </GuestsOnly>
  );
};

export default AuthLayout;
