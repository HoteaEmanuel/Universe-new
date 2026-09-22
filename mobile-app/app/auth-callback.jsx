// app/auth-callback.tsx
import { useEffect } from "react";
import { View, Text, ActivityIndicator, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import api from "../utils/api";
import { useAuthStore } from "../store/authStore";

export default function AuthCallback() {
  const { code, error } = useLocalSearchParams();
  const { setUser } = useAuthStore();

  useEffect(() => {
    const handleAuth = async () => {
      if (error) {
        alert("Authentication failed");
        router.replace("/login");
        return;
      }

      if (code) {
        try {
          const response = await api.post("/auth/google/mobile-exchange", {
            code,
          });
          const { accessToken, refreshToken, user } = response.data;

          await SecureStore.setItemAsync("accessToken", accessToken);
          await SecureStore.setItemAsync("refreshToken", refreshToken);

          setUser(user);
          router.replace("/home");
        } catch (err) {
          alert("Authentication failed");
          router.replace("/login");
        }
      } else {
        router.replace("/login");
      }
    };

    handleAuth();
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#000", padding: 20 }}>
      <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
      <Text style={{ color: "#fff", textAlign: "center", marginTop: 10 }}>
        Processing...
      </Text>
    </ScrollView>
  );
}
