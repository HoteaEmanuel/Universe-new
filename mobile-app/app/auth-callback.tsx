import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import api from "../utils/api";
import { useAuthStore } from "../store/authStore";

export default function AuthCallback() {
  const { code, error } = useLocalSearchParams<{ code?: string; error?: string }>();
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const handleAuth = async () => {
      if (error) {
        alert("Authentication failed");
        router.replace("/login");
        return;
      }

      if (code) {
        try {
          const response = await api.post("/auth/google/mobile-exchange", { code });
          const { accessToken, refreshToken, user } = response.data;

          await SecureStore.setItemAsync("accessToken", accessToken);
          await SecureStore.setItemAsync("refreshToken", refreshToken);

          setUser(user);
          router.replace("/home");
        } catch {
          alert("Authentication failed");
          router.replace("/login");
        }
      } else {
        router.replace("/login");
      }
    };

    handleAuth();
    // Runs once on mount for the one-shot deep-link exchange; code/error
    // come from the initial route params and don't change during this
    // screen's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0710", alignItems: "center", justifyContent: "center", gap: 12 }}>
      <ActivityIndicator size="large" color="#fafafa" />
      <Text style={{ color: "#fafafa" }}>Processing...</Text>
    </View>
  );
}
