import { Tabs } from "expo-router/js-tabs";
import LoggedUserOnly from "@components/auth/LoggedUserOnly";
import GlassTabBar from "@components/navigation/GlassTabBar";

// Tab icons, colors, and sizing all live in GlassTabBar now - this layout
// only declares the routes and their labels.
const DashboardLayout = () => {
  return (
    <LoggedUserOnly>
      <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <GlassTabBar {...props} />}>
        <Tabs.Screen name="home" options={{ title: "Home" }} />
        <Tabs.Screen name="chat" options={{ title: "Chat" }} />
        <Tabs.Screen name="opportunities" options={{ title: "Opportunities" }} />
        <Tabs.Screen name="create-post" options={{ title: "Create" }} />
        <Tabs.Screen name="events" options={{ title: "Events" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
    </LoggedUserOnly>
  );
};

export default DashboardLayout;
