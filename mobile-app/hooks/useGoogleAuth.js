// mobile-app/hooks/useGoogleAuth.js
import { useState, useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import Constants from "expo-constants";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  // Ascultă deep links
  useEffect(() => {
    const handleDeepLink = async (event) => {
      const { url } = event;
      console.log("🔗 Deep link received:", url);

      if (url?.includes("auth-callback")) {
        try {
          const { queryParams } = Linking.parse(url);
          const token = queryParams?.token;
          const error = queryParams?.error;
          const userJson = queryParams?.user;

          if (error) {
            console.error("❌ Auth error:", error);
            alert("Authentication failed. Please try again.");
            return;
          }

          if (token) {
            console.log("✅ Token received");

            // Salvează token în SecureStore
            await SecureStore.setItemAsync("jwtToken", token);

            // Parse user data
            let user = null;
            if (userJson) {
              user = JSON.parse(decodeURIComponent(userJson));
            }

            console.log("✅ User logged in:", user?.email);

            // Navighează la home
            router.replace("/home");
          }
        } catch (error) {
          console.error("❌ Deep link error:", error);
          alert("Authentication failed. Please try again.");
        }
      }
    };

    // Subscribe la deep link events
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Check dacă app-ul s-a deschis cu un deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => subscription.remove();
  }, []);

  const promptAsync = async () => {
    try {
      setIsLoading(true);

      const API_URL =
        Constants.expoConfig?.extra?.API_URL || "https://abc123.ngrok-free.app";

      console.log("🌐 Opening browser:", `${API_URL}/auth/google/mobile-init`);

      // Deschide browser către backend
      await WebBrowser.openBrowserAsync(`${API_URL}/auth/google/mobile-init`);
    } catch (error) {
      console.error("❌ Error opening browser:", error);
      alert("Failed to open login page");
    } finally {
      setIsLoading(false);
    }
  };

  return { promptAsync, isLoading };
};
