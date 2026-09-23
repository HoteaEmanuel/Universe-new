import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import api from "../utils/api";

const API_URL: string =
  Constants.expoConfig?.extra?.API_URL ||
  "https://nongerundively-vatic-manie.ngrok-free.dev/api";
const BASE_URL = API_URL.replace(/\/api\/?$/, "");

// The real session shape isn't fully typed yet (this predates
// packages/shared's User DTO and the backend returns a superset of fields
// depending on the endpoint) — `Record<string, unknown>` keeps `set`/read
// sites honest that they're touching an open bag of fields rather than a
// contract, without blocking the TS migration on modeling every endpoint's
// exact response shape up front.
export type AuthUser = Record<string, unknown> & { id?: string };

type SignUpPayload = {
  firstName?: string;
  lastName?: string;
  name?: string;
  major?: string;
  email: string;
  password: string;
  accountType?: string;
};

type AuthErrorLike = {
  response?: { data?: { message?: string }; status?: number };
};

const messageFrom = (error: unknown, fallback: string): string => {
  const err = error as AuthErrorLike;
  return err?.response?.data?.message || fallback;
};

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  isCheckingAuth: boolean;
  socket: Socket | null;
  onlineUsers: string[];

  clearError: () => void;
  setUser: (user: AuthUser | null) => void;
  updateCurrentUser: (updates: Partial<AuthUser>) => void;
  signUp: (payload: SignUpPayload) => Promise<void>;
  changeProfilePicture: (image: string) => Promise<void>;

  changePassword: (newPassword: string, currentPassword?: string) => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
  getBusinessRegistrations: () => Promise<unknown>;
  acceptBusinessRegistration: (id: string) => Promise<unknown>;
  rejectBusinessRegistration: (id: string) => Promise<unknown>;
  logIn: (email: string, password: string) => Promise<unknown>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  sendVerificationEmail: (email: string) => Promise<void>;
  verifyEmail: (email: string, verificationCode: string) => Promise<void>;
  logOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  connectSocket: () => Promise<void>;
  disconnectSocket: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  isCheckingAuth: true,
  socket: null,
  onlineUsers: [],

  clearError: () => set({ error: null }),
  setUser: (user) => {
    set({ user, isAuthenticated: true });
  },
  updateCurrentUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  signUp: async ({ firstName, lastName, name, major, email, password, accountType }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/auth/signup", {
        firstName,
        lastName,
        name,
        major,
        email,
        password,
        accountType,
      });
      set({ user: response.data.user });
    } catch (error) {
      set({ error: messageFrom(error, "Sign up failed") });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  changeProfilePicture: async (image) => {
    set({ isLoading: true, error: null });
    try {
      set((state) => ({
        user: state.user ? { ...state.user, profilePicture: image } : state.user,
      }));
    } catch (error) {
      set({ error: messageFrom(error, "Could not update profile picture") });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  getBusinessRegistrations: async () => {
    try {
      const response = await api.get("/auth/business-account-registrations");
      return response.data.businessRegistrations;
    } catch (error) {
      const message = messageFrom(error, "Login failed");
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isLoading: false });
    }
  },

  acceptBusinessRegistration: async (id) => {
    try {
      return await api.post(`/auth/accept-business-registration/${id}`);
    } catch (error) {
      const message = messageFrom(error, "Login failed");
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isLoading: false });
    }
  },

  rejectBusinessRegistration: async (id) => {
    try {
      return await api.post(`/auth/reject-business-registration/${id}`);
    } catch (error) {
      set({ error: messageFrom(error, "Login failed") });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/auth/login/mobile", { email, password });

      await SecureStore.setItemAsync("accessToken", response.data.accessToken);
      await SecureStore.setItemAsync("refreshToken", response.data.refreshToken);

      set({ isAuthenticated: true, user: response?.data?.user || null });
      get().connectSocket();
      return response.data;
    } catch (error) {
      const message = messageFrom(error, "Login failed");
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isLoading: false });
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await api.post("/auth/forgot-password", { email });
    } catch (error) {
      set({ error: messageFrom(error, "Request failed") });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (token, password) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
    } catch (error) {
      set({ error: messageFrom(error, "Request failed") });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  sendVerificationEmail: async (email) => {
    set({ isLoading: true, isAuthenticated: false, error: null });
    try {
      await api.post("/auth/resend-verify-email", { email });
    } catch (error) {
      set({ error: messageFrom(error, "Could not find email") });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  verifyEmail: async (email, verificationCode) => {
    set({ isLoading: true, error: null });
    try {
      await api.post("/auth/verify-email", { email, verificationCode });
    } catch (error) {
      set({ error: messageFrom(error, "Verification failed") });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  changePassword: async (newPassword, currentPassword) => {
    set({ isLoading: true, error: null });
    try {
      await api.post("/change-password", { currentPassword, newPassword });
    } catch (error) {
      set({ error: messageFrom(error, "Could not change password") });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteAccount: async (password) => {
    set({ isLoading: true, error: null });
    try {
      await api.post("/delete-account", { password });
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      get().disconnectSocket();
      set({ isAuthenticated: false, user: null });
    } catch (error) {
      set({ error: messageFrom(error, "Could not delete account") });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logOut: async () => {
    set({ isLoading: true, error: null });
    try {
      const refreshToken = await SecureStore.getItemAsync("refreshToken");
      await api.post("/auth/logout", { refreshToken });
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      get().disconnectSocket();
      set({ isAuthenticated: false, user: null });
    } catch (error) {
      set({ error: messageFrom(error, "Log out failed") });
    } finally {
      set({ isLoading: false });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true, error: null, isAuthenticated: false, isCheckingAuth: true });
    try {
      const response = await api.post("/auth/check-auth");
      set({
        isAuthenticated: true,
        isCheckingAuth: false,
        user: response?.data?.user || null,
      });
      get().connectSocket();
    } catch (error) {
      const err = error as AuthErrorLike;
      set({
        error: err.response?.status === 401 ? null : (err.response?.data?.message ?? null),
        isAuthenticated: false,
        user: null,
        isCheckingAuth: false,
      });
    } finally {
      set({ isLoading: false, isCheckingAuth: false });
    }
  },

  connectSocket: async () => {
    const { user } = get();
    if (!user || get().socket?.connected) return;
    const token = await SecureStore.getItemAsync("accessToken");
    if (!token) return;
    const socket = io(BASE_URL, { auth: { token } });
    socket.connect();
    set({ socket });
    socket.on("getOnlineUsers", (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket?.disconnect();
    set({ socket: null });
  },
}));
