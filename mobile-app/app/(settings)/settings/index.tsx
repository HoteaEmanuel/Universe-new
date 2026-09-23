import { View, ScrollView, useColorScheme } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ThemedView from "../../../components/ThemedView";
import ThemedText from "../../../components/ThemedText";
import SettingsSection from "../../../components/settings/SettingsSection";
import SettingsRow from "../../../components/settings/SettingsRow";
import { Colors } from "../../../constants/colors";
import { IconSizes } from "../../../constants/iconSizes";
import { PressableScale } from "../../../lib/styled";

const Settings = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;

  return (
    <ThemedView safe fullHeight>
      <View className="flex-row items-center gap-3 px-4 pt-2">
        <PressableScale onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={IconSizes.xl} color={theme.iconMuted} />
        </PressableScale>
        <ThemedText title className="text-lg font-bold">
          Settings
        </ThemedText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        className="px-4 pt-6"
      >
        <View className="gap-6">
          <SettingsSection title="Account">
            <SettingsRow
              title="Edit Profile"
              icon="person-outline"
              onPress={() => router.push("/settings/edit-profile")}
            />
            <SettingsRow
              title="Change Password"
              icon="lock-closed-outline"
              onPress={() => router.push("/settings/change-password")}
            />
            <SettingsRow
              title="Delete Account"
              icon="trash-outline"
              danger
              onPress={() => router.push("/settings/delete-account")}
            />
          </SettingsSection>

          <SettingsSection title="Preferences">
            <SettingsRow
              title="Notifications"
              icon="notifications-outline"
              onPress={() => router.push("/settings/notifications")}
            />
            <SettingsRow
              title="Appearance"
              icon="color-palette-outline"
              onPress={() => router.push("/settings/appearance")}
            />
          </SettingsSection>

          <SettingsSection title="Privacy">
            <SettingsRow
              title="Privacy & Safety"
              subtitle="Blocked accounts"
              icon="shield-checkmark-outline"
              onPress={() => router.push("/settings/privacy")}
            />
          </SettingsSection>

          <SettingsSection title="About">
            <SettingsRow
              title="Legal & Terms"
              icon="document-text-outline"
              onPress={() => router.push("/settings/legal-terms")}
            />
            <SettingsRow
              title="Suggest More"
              subtitle="Tell us what you'd like to see next"
              icon="bulb-outline"
              onPress={() => router.push("/settings/suggest-more")}
            />
          </SettingsSection>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default Settings;
