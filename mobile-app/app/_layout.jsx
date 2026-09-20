import { View, Text } from "react-native";
import { useEffect } from "react";
import { useRef } from "react";
import {
  useFonts,
  KaushanScript_400Regular,
} from "@expo-google-fonts/kaushan-script";
import React from "react";
import { router, Stack } from "expo-router";
import "../global.css";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { Colors } from "../constants/colors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
const RootLayout = () => {
  const [fontsLoaded] = useFonts({
    KaushanScript_400Regular,
  });
  const colorScheme = useColorScheme();

  const theme = Colors[colorScheme] || Colors.light;

  if (!fontsLoaded) {
    return null;
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
          <Stack.Screen name="(post)" options={{ headerShown: false }} />
          <Stack.Screen name="(profile)" options={{ headerShown: false }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
};

export default RootLayout;
