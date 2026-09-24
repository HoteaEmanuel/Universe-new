import { View, Text, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Post } from "@universe/shared";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { OPPORTUNITY_TYPE_LABELS, WORKPLACE_TYPE_LABELS } from "@constants/opportunityLabels";
import { PressableScale } from "@lib/styled";
import { useSetOpportunityClosedMutation } from "@queryAndMutation/mutations/post-mutation";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import { applyUrlHostname, formatOpportunityDeadline } from "@utils/opportunity";

type Tone = "brand" | "muted" | "destructive";

const Badge = ({ label, icon, tone }: { label: string; icon?: keyof typeof Ionicons.glyphMap; tone: Tone }) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const bg = tone === "brand" ? Colors.primary : tone === "destructive" ? Colors.warning : theme.borderColor;
  const fg = tone === "muted" ? theme.text : "#ffffff";
  return (
    <View className="flex-row items-center gap-1 rounded-full px-2.5 py-1" style={{ backgroundColor: bg }}>
      {icon ? <Ionicons name={icon} size={IconSizes.xs} color={fg} /> : null}
      <Text className="text-2xs font-semibold" style={{ color: fg }}>
        {label}
      </Text>
    </View>
  );
};

type OpportunitySummaryProps = { post: Post; isOwner: boolean };


const OpportunitySummary = ({ post, isOwner }: OpportunitySummaryProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const statusMutation = useSetOpportunityClosedMutation(post.id);

  const expired = !!post.isOpportunityExpired;
  const host = applyUrlHostname(post.applyUrl);
  const deadline = formatOpportunityDeadline(post.deadlineAt);

  const apply = () => {
    if (!expired && post.applyUrl) Linking.openURL(post.applyUrl).catch(() => {});
  };

  const toggleStatus = () => statusMutation.mutate(!post.opportunityClosedAt);

  return (
    <View
      className="mx-4 mt-2 gap-3 rounded-2xl p-4"
      style={{ backgroundColor: colorScheme === "light" ? "#6849a70f" : "#6849a71a" }}
    >
      <View className="flex-row flex-wrap items-center gap-1.5">
        <Badge
          label={post.opportunityType ? OPPORTUNITY_TYPE_LABELS[post.opportunityType] : "Opportunity"}
          icon="briefcase"
          tone="brand"
        />
        {post.workplaceType ? <Badge label={WORKPLACE_TYPE_LABELS[post.workplaceType]} tone="muted" /> : null}
        {expired ? <Badge label="Applications closed" tone="destructive" /> : null}
      </View>

      <View className="gap-1.5">
        {post.companyName ? (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="checkmark-circle" size={IconSizes.sm} color={Colors.primary} />
            <Text className="text-sm font-semibold" style={{ color: theme.title }}>
              {post.companyName}
            </Text>
          </View>
        ) : null}
        {post.location ? (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="location-outline" size={IconSizes.sm} color={theme.tabIconColour} />
            <Text className="text-sm" style={{ color: theme.text }}>
              {post.location}
            </Text>
          </View>
        ) : null}
        {deadline ? (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="time-outline" size={IconSizes.sm} color={theme.tabIconColour} />
            <Text className="text-sm" style={{ color: theme.text }}>
              Apply by {deadline}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row flex-wrap items-center gap-2.5 pt-1">
        <PressableScale
          onPress={apply}
          enabled={!expired && !!post.applyUrl}
          className="flex-row items-center gap-1.5 rounded-full px-4 py-2.5"
          style={{ backgroundColor: expired ? theme.borderColor : Colors.primary, opacity: !post.applyUrl && !expired ? 0.5 : 1 }}
        >
          <Ionicons name="open-outline" size={IconSizes.sm} color={expired ? theme.tabIconColour : "#ffffff"} />
          <Text className="text-xs font-bold" style={{ color: expired ? theme.tabIconColour : "#ffffff" }}>
            {expired ? "Applications closed" : "Apply externally"}
          </Text>
        </PressableScale>
        {host && !expired ? (
          <Text className="text-2xs" style={{ color: theme.tabIconColour }}>
            Opens {host}
          </Text>
        ) : null}
        {isOwner ? (
          <PressableScale onPress={toggleStatus} enabled={!statusMutation.isPending} className="ml-auto px-2 py-1.5">
            <Text className="text-xs font-semibold" style={{ color: theme.tabIconColour }}>
              {post.opportunityClosedAt ? "Reopen" : "Close listing"}
            </Text>
          </PressableScale>
        ) : null}
      </View>
    </View>
  );
};

export default OpportunitySummary;
