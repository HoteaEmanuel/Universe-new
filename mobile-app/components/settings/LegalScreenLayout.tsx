import { View, ScrollView, Text } from "react-native";
import ThemedView from "@components/ThemedView";
import ThemedText from "@components/ThemedText";
import { Colors } from "@constants/colors";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import SettingsScreenHeader from "./SettingsScreenHeader";

export type LegalBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

export type LegalSectionData = {
  heading?: string;
  blocks: LegalBlock[];
};

type LegalScreenLayoutProps = {
  title: string;
  lastUpdated: string;
  sections: LegalSectionData[];
};

const LegalScreenLayout = ({ title, lastUpdated, sections }: LegalScreenLayoutProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;

  return (
    <ThemedView safe fullHeight>
      <SettingsScreenHeader title={title} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        className="px-gutter pt-stack"
      >
        <Text className="text-xs" style={{ color: theme.tabIconColour }}>
          Last updated {lastUpdated}
        </Text>

        <View className="gap-section pt-section">
          {sections.map((section, index) => (
            <View key={index} className="gap-2">
              {section.heading ? (
                <ThemedText title className="text-base font-bold">
                  {section.heading}
                </ThemedText>
              ) : null}
              {section.blocks.map((block, blockIndex) =>
                block.type === "paragraph" ? (
                  <ThemedText key={blockIndex} className="text-sm leading-relaxed">
                    {block.text}
                  </ThemedText>
                ) : (
                  <View key={blockIndex} className="gap-1.5 pl-1">
                    {block.items.map((item, itemIndex) => (
                      <View key={itemIndex} className="flex-row gap-2 pr-1">
                        <ThemedText className="text-sm leading-relaxed">{"•"}</ThemedText>
                        <ThemedText className="flex-1 text-sm leading-relaxed">{item}</ThemedText>
                      </View>
                    ))}
                  </View>
                ),
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default LegalScreenLayout;
