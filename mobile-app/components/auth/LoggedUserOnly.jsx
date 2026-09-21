import { View, Text } from "react-native";
import React, { useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { router } from "expo-router";
const LoggedUserOnly = ({ children }) => {
  const { user } = useAuthStore();
  useEffect(() => {
    if (user==null) {
      // Dacă nu e user, redirecționează la login
      router.replace("/login");
    }
  }, [user]);
  return children;
};

export default LoggedUserOnly;
