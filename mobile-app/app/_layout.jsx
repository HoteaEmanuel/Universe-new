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
import { ScopedTheme } from "uniwind";
import { Colors } from "@constants/colors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useAuthStore } from "@store/authStore";
import { useThemeStore } from "@store/themeStore";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import { useGetPreferencesQuery } from "@queryAndMutation/queries/preferences-queries";
import ConfirmDialog from "@components/ConfirmDialog";

// Mounted inside QueryClientProvider (useQuery needs that context) purely to
// fire the preferences fetch once at app boot - its onSuccess side effect
// (themeStore.setPreferenceColorScheme) is what every other screen reacts to.
const PreferencesSync = () => {
  useGetPreferencesQuery();
  return null;
};

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
  const systemColorScheme = useColorScheme();
  const setSystemColorScheme = useThemeStore((state) => state.setSystemColorScheme);
  const hydrateTheme = useThemeStore((state) => state.hydrate);
  const themeHydrated = useThemeStore((state) => state.hydrated);
  const colorScheme = useAppColorScheme();
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);

  useEffect(() => {
    checkAuth();
    hydrateTheme();
  }, [checkAuth, hydrateTheme]);

  // Only takes effect while no saved preference is overriding it - keeps the
  // app following the OS scheme live, same as before this feature, for
  // anyone who hasn't set an explicit preference yet.
  useEffect(() => {
    setSystemColorScheme(systemColorScheme === "dark" ? "dark" : "light");
  }, [systemColorScheme, setSystemColorScheme]);

  const theme = Colors[colorScheme] || Colors.light;

  if (!fontsLoaded || isCheckingAuth || !themeHydrated) {
    return null;
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          {/* Scopes every Uniwind dark:/light: className in the tree to the
              resolved app theme, not just the OS scheme Uniwind would
              otherwise read on its own. */}
          <ScopedTheme theme={colorScheme}>
            <BottomSheetModalProvider>
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
                <Stack.Screen name="(post)/edit-post/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="(event)/event-details/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="(event)/edit-event/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="(event)/create-event/index" options={{ headerShown: false }} />
                <Stack.Screen name="(event)/invite-to-event/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="(event)/event-participants/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="(profile)/profile/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="(comments)/comments/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="(chat)/conversation/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="(chat)/new-conversation/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="(chat)/details/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="(chat)/media/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="(chat)/members/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="(settings)/settings/index" options={{ headerShown: false }} />
                <Stack.Screen name="(settings)/settings/edit-profile" options={{ headerShown: false }} />
                <Stack.Screen name="(settings)/settings/change-password" options={{ headerShown: false }} />
                <Stack.Screen name="(settings)/settings/delete-account" options={{ headerShown: false }} />
                <Stack.Screen name="(settings)/settings/notifications" options={{ headerShown: false }} />
                <Stack.Screen name="(settings)/settings/appearance" options={{ headerShown: false }} />
                <Stack.Screen name="(settings)/settings/privacy" options={{ headerShown: false }} />
                <Stack.Screen name="(settings)/settings/legal-terms" options={{ headerShown: false }} />
                <Stack.Screen name="(settings)/settings/privacy-policy" options={{ headerShown: false }} />
                <Stack.Screen name="(settings)/settings/terms-of-service" options={{ headerShown: false }} />
                <Stack.Screen name="(settings)/settings/suggest-more" options={{ headerShown: false }} />
              </Stack>
              <ConfirmDialog />
              <PreferencesSync />
            </BottomSheetModalProvider>
          </ScopedTheme>
        </QueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
};

export default RootLayout;
