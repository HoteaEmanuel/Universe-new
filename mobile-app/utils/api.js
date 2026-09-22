import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { router } from "expo-router";

const API_URL = Constants.expoConfig?.extra?.API_URL || "http://10.0.2.2:5000";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

const clearSessionAndRedirect = async () => {
  await SecureStore.deleteItemAsync("accessToken");
  await SecureStore.deleteItemAsync("refreshToken");
  router.replace("/login");
};

// Concurrent 401s (e.g. a screen firing several queries at once) must not
// each trigger their own refresh-mobile call, since /auth/refresh-mobile
// rotates the refresh token — a second call with the now-stale token would
// fail. Every 401 that arrives while a refresh is already in flight awaits
// the same promise instead of starting a new one.
let refreshPromise = null;

const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await SecureStore.getItemAsync("refreshToken");
      if (!refreshToken) throw new Error("No refresh token");
      const { data } = await axios.post(`${API_URL}/auth/refresh-mobile`, {
        refreshToken,
      });
      await SecureStore.setItemAsync("accessToken", data.accessToken);
      await SecureStore.setItemAsync("refreshToken", data.refreshToken);
      return data.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    if (response?.status !== 401 || config?._retriedAfterRefresh) {
      return Promise.reject(error);
    }

    try {
      const accessToken = await refreshAccessToken();
      config._retriedAfterRefresh = true;
      config.headers.Authorization = `Bearer ${accessToken}`;
      return api.request(config);
    } catch {
      await clearSessionAndRedirect();
      return Promise.reject(error);
    }
  },
);

export default api;
