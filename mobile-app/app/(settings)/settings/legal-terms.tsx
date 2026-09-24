import { View, ScrollView } from "react-native";
import { router } from "expo-router";
import ThemedView from "@components/ThemedView";
import SettingsScreenHeader from "@components/settings/SettingsScreenHeader";
import SettingsSection from "@components/settings/SettingsSection";
import SettingsRow from "@components/settings/SettingsRow";

const LegalTerms = () => (
  <ThemedView safe fullHeight>
    <SettingsScreenHeader title="Legal & Terms" />

    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
      className="px-4 pt-6"
    >
      <View className="gap-6">
        <SettingsSection title="Documents">
          <SettingsRow
            title="Privacy Policy"
            icon="document-text-outline"
            onPress={() => router.push("/settings/privacy-policy")}
          />
          <SettingsRow
            title="Terms of Service"
            icon="reader-outline"
            onPress={() => router.push("/settings/terms-of-service")}
          />
        </SettingsSection>
      </View>
    </ScrollView>
  </ThemedView>
);

export default LegalTerms;
