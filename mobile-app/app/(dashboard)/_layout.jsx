import { View, Text } from "react-native";
import React from "react";
import { Tabs } from "expo-router";
import { Colors } from "@constants/colors";
import { Ionicons } from "@expo/vector-icons";
import LoggedUserOnly from "@components/auth/LoggedUserOnly";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

const DashboardLayout = () => {
  const colorScheme = useAppColorScheme();
  const theme = Colors[colorScheme] || Colors.light;
  return (
    <LoggedUserOnly>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: theme.background },
          tabBarActiveTintColor: theme.tabIconColourFocused,
          tabBarInactiveTintColor: theme.tabIconColour,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={24}
                color={focused ? theme.tabIconColourFocused : theme.tabIconColour}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={24}
                color={focused ? theme.tabIconColourFocused : theme.tabIconColour}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="create-post"
          options={{
            title: "Create",
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? "add-circle" : "add-circle-outline"}
                size={24}
                color={focused ? theme.tabIconColourFocused : theme.tabIconColour}
              />
            ),
          }}
        />
      </Tabs>
    </LoggedUserOnly>
  );
};

export default DashboardLayout;
