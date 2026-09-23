import { View, ScrollView } from "react-native";
import { router } from "expo-router";
import ThemedView from "../../../components/ThemedView";
import SettingsScreenHeader from "../../../components/settings/SettingsScreenHeader";
import SettingsSection from "../../../components/settings/SettingsSection";
import SettingsRow from "../../../components/settings/SettingsRow";

const Settings = () => {
  return (
    <ThemedView safe fullHeight>
      <SettingsScreenHeader title="Settings" />

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
