import { View } from "react-native";
import ThemedView from "@components/ThemedView";
import SettingsScreenHeader from "@components/settings/SettingsScreenHeader";
import SettingsSection from "@components/settings/SettingsSection";
import SettingsToggleRow from "@components/settings/SettingsToggleRow";
import ThemeLandscape from "@components/settings/ThemeLandscape";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import { useUpdatePreferencesMutation } from "@queryAndMutation/mutations/preferences-mutation";

const Appearance = () => {
  const colorScheme = useAppColorScheme();
  const { mutate: updatePreferences } = useUpdatePreferencesMutation();

  const toggleTheme = (isDark: boolean) => {
    updatePreferences({ theme: isDark ? "dark" : "light" });
  };

  return (
    <ThemedView safe fullHeight>
      <SettingsScreenHeader title="Appearance" />

      <View className="gap-6 px-4 pt-6">
        <ThemeLandscape />

        <SettingsSection title="Theme">
          <SettingsToggleRow
            title="Dark mode"
            subtitle={colorScheme === "dark" ? "Currently on" : "Currently off"}
            value={colorScheme === "dark"}
            onValueChange={toggleTheme}
          />
        </SettingsSection>
      </View>
    </ThemedView>
  );
};

export default Appearance;
