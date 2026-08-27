import axios from "axios";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

const BLOCKED_TOAST_ID = "account-blocked";

// Enforcement of an admin block only happens when a refresh-token rotation
// hits the backend (see verifyToken.ts) - up to ~15 min after the block, not
// instantly. When that rotation fails with ACCOUNT_BLOCKED, this is the only
// place a mid-session user finds out and gets logged out; there was no
// existing global interceptor for auth failures before this.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error?.response?.data as
      | { code?: string; reason?: string | null }
      | undefined;
    if (data?.code === "ACCOUNT_BLOCKED") {
      useAuthStore.setState({ isAuthenticated: false, user: null });
      toast.error(
        `Your account has been blocked${data.reason ? `: ${data.reason}` : ""}. You've been logged out.`,
        { id: BLOCKED_TOAST_ID, duration: Infinity },
      );
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);
