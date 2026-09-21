import { View, Text } from "react-native";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import GuestsOnly from "../../components/auth/GuestsOnly";
const AuthLayout = () => {
  return (
    <GuestsOnly>
      <StatusBar value="auto" />
      <Stack screenOptions={{ headerShown: false, animation: "none" }}></Stack>
    </GuestsOnly>
  );
};

export default AuthLayout;
