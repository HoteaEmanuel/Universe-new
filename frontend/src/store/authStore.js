import { create } from "zustand";
import axios from "axios";
import { io } from "socket.io-client";
const BASE_URL = "http://localhost:5000";
const API_URL = "http://localhost:5000/api";
axios.defaults.withCredentials = true;
export const useAuthStore = create((set, get) => ({
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
      set({ error: eroare?.response?.data?.message || "Sign up failed" });
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
        user: { ...state.user, profilePicture: image },
      }));
      // return response;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getBusinessRegistrations: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/auth/business-account-registrations`
      );
      return response.data.businessRegistrations;
    } catch (error) {
      set({ error: error?.response?.data?.message || "Login failed" });
    } finally {
      set({ isLoading: false });
    }
  },
  acceptBusinessRegistration: async (id) => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/accept-business-registrations/${id}`
      );
      return response;
    } catch (error) {
      set({ error: error?.response?.data?.message || "Login failed" });
    } finally {
      set({ isLoading: false });
    }
  },
  rejectBusinessRegistration: async (id) => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/reject-business-registrations/${id}`
      );
      return response;
    } catch (error) {
      set({ error: error?.response?.data?.message || "Login failed" });
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
      console.log(response)
      set({ isAuthenticated: true, user: response?.data?.user || null });
      get().connectSocket();
    } catch (error) {
      console.log("ERROR FOUND");
      console.log(error)
      set({ error: error?.response?.data?.message || "Login failed" });
    } finally {
      set({ isLoading: false });
    }
  },
  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
    } catch (error) {
      set({ error: error.response.data.message || "Request failed" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  resetPassword: async (token, password) => {
    set({ isLoading: true, error: null });
    try {
      console.log(token,password);
      await axios.post(`${API_URL}/auth/reset-password/${token}`, { password });
    } catch (eroare) {
      set({ error: eroare.response.data.message || "Request failed" });
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
      set({
        isLoading: false,
        error: error.response.data.message || "Could not find email",
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
      set({
        error: eroare.response.data.message || "Verification failed",
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
      set({ error: error.response.data.message || "Log out failed" });
    } finally {
      set({ isLoading: false });
    }
  },
  checkAuth: async () => {
    set({
      isLoading: true,
      error: null,
      isAuthenticated: false,
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
      set({
        error:
          error.response?.status === 401 ? null : error.response?.data?.message,
        isAuthenticated: false,
        user: null,
        isCheckingAuth: false,
      });
      // throw new Error(error);
    } finally {
      set({ isLoading: false, isCheckingAuth: false });
    }
  },
  connectSocket: () => {
    const { user } = get();
    if (!user || get().socket?.connected) return;
    const socket = io(BASE_URL, {
      query: {
        userId: user?.id,
      },
    });
    socket.connect();
    set({ socket: socket });
    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
    get().socket.on();
  },
}));
