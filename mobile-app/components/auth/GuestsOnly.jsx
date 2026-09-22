import React, { useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { useRouter } from "expo-router";
const GuestsOnly = ({ children }) => {
  // Selecting just the id (a stable string) instead of the whole `user`
  // object: `user` gets a new object reference from every store update
  // (even unrelated ones, e.g. socket/onlineUsers), which was re-firing
  // this effect and calling router.replace repeatedly.
  const userId = useAuthStore((state) => state.user?.id);
  const router = useRouter();
  useEffect(() => {
    if (userId != null) {
      router.replace("/profile");
    }
  }, [userId, router]);
  return children;
};

export default GuestsOnly;
