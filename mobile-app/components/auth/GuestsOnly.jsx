import { View, Text } from "react-native";
import React from "react";
import { useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { useRouter } from "expo-router";
const GuestsOnly = ({ children }) => {
  const { user } = useAuthStore();
  const router = useRouter();
  useEffect(() => {
    if (user != null) {
      // Dacă e user, redirecționează la dashboard
      console.log("USER IS LOGGED IN");
      router.replace("/profile");
    }
  }, [user]);
  return children;
};

export default GuestsOnly;
