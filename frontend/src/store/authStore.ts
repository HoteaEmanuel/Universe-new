import { create } from "zustand";
import axios from "axios";
import { io, type Socket } from "socket.io-client";
import type { AccountType, User } from "../queryAndMutation/types";

const BASE_URL = "http://localhost:5000";
const API_URL = "http://localhost:5000/api";
axios.defaults.withCredentials = true;

type SignUpPayload = {
  firstName?: string;
  lastName?: string;
  name?: string;
  major?: string;
  email: string;
  password: string;
  accountType?: AccountType;
};

type AuthStore = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  isCheckingAuth: boolean;
  isVerified?: boolean;
  socket: Socket | null;
  onlineUsers: string[];
  clearError: () => void;
  signUp: (payload: SignUpPayload) => Promise<void>;
  changeProfilePicture: (image: string) => Promise<void>;
  getBusinessRegistrations: () => Promise<User[] | undefined>;
  acceptBusinessRegistration: (id: string) => Promise<unknown>;
  rejectBusinessRegistration: (id: string) => Promise<unknown>;
  logIn: (email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  sendVerificationEmail: (email: string) => Promise<void>;
  verifyEmail: (verificationCode: string) => Promise<void>;
  logOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  connectSocket: () => void;
  disconnectSocket: () => void;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  isCheckingAuth: true,
  socket: null,
  onlineUsers: [],
  clearError: () => set({ error: null }),
  signUp: async ({
    firstName,
    lastName,
    name,
    major,
    email,
    password,
    accountType,
  }) => {
    set({ isLoading: true, error: null });
    console.log(firstName, lastName, name, major, email, password, accountType);
    try {
      const response = await axios.post(`${API_URL}/auth/signup`, {
        firstName,
        lastName,
        name,
        major,
        email,
        password,
        accountType,
      });
      set({ user: response.data.user });
    } catch (eroare) {
      console.log("EROARE LA SIGN UP");
      console.log(eroare);
      const error = eroare as { response?: { data?: { message?: string } } };
      set({ error: error?.response?.data?.message || "Sign up failed" });
      throw eroare;
    } finally {
      set({ isLoading: false });
    }
  },
  changeProfilePicture: async (image) => {
    set({ isLoading: true, error: null });
    try {
      // const formdata = new FormData();
      // formdata.append("image", image);
      // const response = await axios.put(
      //   `${API_URL}/update-profile-image`,
      //   formdata,
      //   {
      //     headers: { "Content-Type": "multipart/form-data" },
      //   }
      // );
      set((state) => ({
        user: state.user ? { ...state.user, profilePicture: image } : state.user,
      }));
      // return response;
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      set({ error: err?.response?.data?.message || "Could not update profile picture" });
      throw new Error(err?.response?.data?.message);
    } finally {
      set({ isLoading: false });
    }
  },
  getBusinessRegistrations: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/auth/business-account-registrations`,
      );
      return response.data.businessRegistrations;
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      set({ error: err?.response?.data?.message || "Login failed" });
    } finally {
      set({ isLoading: false });
    }
  },
  acceptBusinessRegistration: async (id) => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/accept-business-registrations/${id}`,
      );
      return response;
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      set({ error: err?.response?.data?.message || "Login failed" });
    } finally {
      set({ isLoading: false });
    }
  },
  rejectBusinessRegistration: async (id) => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/reject-business-registrations/${id}`,
      );
      return response;
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      set({ error: err?.response?.data?.message || "Login failed" });
    } finally {
      set({ isLoading: false });
    }
  },
  logIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      console.log(response);
      set({ isAuthenticated: true, user: response?.data?.user || null });
      get().connectSocket();
    } catch (error) {
      console.log("ERROR FOUND");
      console.log(error);
      const err = error as { response?: { data?: { message?: string } } };
      set({ error: err?.response?.data?.message || "Login failed" });
    } finally {
      set({ isLoading: false });
    }
  },
  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
    } catch (error) {
      const err = error as { response: { data: { message?: string } } };
      set({ error: err.response.data.message || "Request failed" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  resetPassword: async (token, password) => {
    set({ isLoading: true, error: null });
    try {
      console.log(token, password);
      await axios.post(`${API_URL}/auth/reset-password/${token}`, { password });
    } catch (eroare) {
      const err = eroare as { response: { data: { message?: string } } };
      set({ error: err.response.data.message || "Request failed" });
      throw eroare;
    } finally {
      set({ isLoading: false });
    }
  },
  sendVerificationEmail: async (email) => {
    set({ isLoading: true, isAuthenticated: false, error: null });
    try {
      await axios.post(`${API_URL}/auth/resend-verify-email`, { email });
    } catch (error) {
      const err = error as { response: { data: { message?: string } } };
      set({
        isLoading: false,
        error: err.response.data.message || "Could not find email",
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  verifyEmail: async (verificationCode) => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(`${API_URL}/auth/verify-email`, { verificationCode });
      set({ isVerified: true, isLoading: false });
    } catch (eroare) {
      const err = eroare as { response: { data: { message?: string } } };
      set({
        error: err.response.data.message || "Verification failed",
      });
      throw eroare;
    } finally {
      set({ isLoading: false });
    }
  },
  logOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(`${API_URL}/auth/logout`);
      get().disconnectSocket();
      set({ isAuthenticated: false, user: null });
    } catch (error) {
      const err = error as { response: { data: { message?: string } } };
      set({ error: err.response.data.message || "Log out failed" });
    } finally {
      set({ isLoading: false });
    }
  },
  checkAuth: async () => {
    set({
      isLoading: true,
      error: null,
      isCheckingAuth: true,
    });
    try {
      const response = await axios.post(`${API_URL}/auth/check-auth`);
      set({
        isAuthenticated: true,
        isCheckingAuth: false,
        user: response?.data?.user || null,
      });
      get().connectSocket();
    } catch (error) {
      const err = error as { response?: { status?: number; data?: { message?: string } } };
      if (!err.response) {
        // Request never reached the server (offline, DNS failure, timeout,
        // etc.) — that's not proof the session is invalid, so don't force a
        // logout. Leave the existing auth state as-is; App retries this once
        // connectivity comes back.
        set({ isCheckingAuth: false, error: "Unable to reach the server" });
        return;
      }
      set({
        error:
          err.response.status === 401 ? null : err.response?.data?.message,
        isAuthenticated: false,
        user: null,
        isCheckingAuth: false,
      });
    } finally {
      set({ isLoading: false, isCheckingAuth: false });
    }
  },
  connectSocket: () => {
    const { user } = get();
    if (!user || get().socket?.connected) return;
    const socket = io(BASE_URL, {
      withCredentials: true,
    });
    socket.connect();
    set({ socket: socket });
    socket.on("getOnlineUsers", (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket?.connected) socket.disconnect();
  },
}));
