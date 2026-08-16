import axios from "axios";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

const NETWORK_TOAST_ID = "network-status";
let isOffline = false;

const markOffline = () => {
  if (isOffline) return;
  isOffline = true;
  toast.error("You're offline. Some features may not work.", {
    id: NETWORK_TOAST_ID,
    duration: Infinity,
  });
};

const markOnline = () => {
  if (!isOffline) return;
  isOffline = false;
  toast.success("Back online", { id: NETWORK_TOAST_ID, duration: 3000 });
  // A checkAuth() that failed while offline couldn't tell a dead session
  // from an unreachable server, so retry now that we're back.
  if (!useAuthStore.getState().isAuthenticated) {
    useAuthStore.getState().checkAuth();
  }
};

// navigator.onLine and the window "online"/"offline" events only reflect
// whether the OS reports *some* network interface as up — on Windows that
// can stay true with WiFi off if a VPN/WSL2/Hyper-V virtual adapter is still
// active, so they're kept only as a fast path when they do fire correctly.
// The reliable signal is real request outcomes, via this axios interceptor,
// since it reflects whether the backend is actually reachable.
window.addEventListener("offline", markOffline);
window.addEventListener("online", markOnline);
if (!navigator.onLine) markOffline();

axios.interceptors.response.use(
  (response) => {
    markOnline();
    return response;
  },
  (error) => {
    if (!error.response) {
      markOffline();
    } else {
      markOnline();
    }
    return Promise.reject(error);
  },
);
