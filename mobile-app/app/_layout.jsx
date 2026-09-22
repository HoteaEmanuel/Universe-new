import { useEffect } from "react";
import {
  useFonts,
  KaushanScript_400Regular,
} from "@expo-google-fonts/kaushan-script";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import React from "react";
import { Stack } from "expo-router";
import "../global.css";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { Colors } from "../constants/colors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { useAuthStore } from "../store/authStore";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
const RootLayout = () => {
  // Each Poppins weight is a separate family: Android won't synthesize bold
  // for a custom font, so global.css exposes them as font-poppins-* tokens
  // and every one of them has to be registered here to resolve.
  const [fontsLoaded] = useFonts({
    KaushanScript_400Regular,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const colorScheme = useColorScheme();
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const theme = Colors[colorScheme] || Colors.light;

  if (!fontsLoaded || isCheckingAuth) {
    return null;
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: theme.navBackground,
              },
              headerTitleStyle: {
                color: theme.title,
              },
            }}
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
            <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
            <Stack.Screen name="(post)/post-details/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="(profile)/profile/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="(comments)/comments/[id]" options={{ headerShown: false }} />
          </Stack>
        </QueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
};

export default RootLayout;
