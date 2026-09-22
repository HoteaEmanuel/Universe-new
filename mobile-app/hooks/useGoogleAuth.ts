// mobile-app/hooks/useGoogleAuth.ts
import { useState, useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import Constants from "expo-constants";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Listens for deep links. Note: this handles a `token`/`user` query-param
  // shape that the actual mobile OAuth flow doesn't send anymore — the real
  // flow is auth-callback.tsx exchanging a `code` param. Kept as-is (ported,
  // not fixed) since untangling which deep-link shape is still live is out
  // of scope for the auth-screens UI redesign this hook was converted for.
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const { url } = event;

      if (url?.includes("auth-callback")) {
        try {
          const { queryParams } = Linking.parse(url);
          const token = queryParams?.token;
          const error = queryParams?.error;
          const userJson = queryParams?.user;

          if (error) {
            console.error("Auth error:", error);
            alert("Authentication failed. Please try again.");
            return;
          }

          if (token) {
            await SecureStore.setItemAsync("jwtToken", String(token));

            if (userJson) {
              JSON.parse(decodeURIComponent(String(userJson)));
            }

            router.replace("/home");
          }
        } catch (error) {
          console.error("Deep link error:", error);
          alert("Authentication failed. Please try again.");
        }
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

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

      const API_URL: string =
        Constants.expoConfig?.extra?.API_URL || "https://abc123.ngrok-free.app";

      await WebBrowser.openBrowserAsync(`${API_URL}/auth/google/mobile-init`);
    } catch (error) {
      console.error("Error opening browser:", error);
      alert("Failed to open login page");
    } finally {
      setIsLoading(false);
    }
  };

  return { promptAsync, isLoading };
};
