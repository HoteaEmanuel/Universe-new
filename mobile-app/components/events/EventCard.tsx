import { View, Text, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { EventSummary } from "@universe/shared";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import { formatEventDateTime } from "@utils/event";

const INFO_BLUE = "#3b82f6";

type Tone = "brand" | "info" | "destructive";

const Badge = ({ label, icon, tone }: { label: string; icon?: keyof typeof Ionicons.glyphMap; tone: Tone }) => {
  const bg = tone === "brand" ? Colors.primary : tone === "info" ? INFO_BLUE : Colors.warning;
  return (
    <View className="flex-row items-center gap-1 rounded-full px-2.5 py-1" style={{ backgroundColor: bg }}>
      {icon ? <Ionicons name={icon} size={IconSizes.xs} color="#ffffff" /> : null}
      <Text className="text-2xs font-semibold" style={{ color: "#ffffff" }}>
        {label}
      </Text>
    </View>
  );
};

type EventCardProps = { event: EventSummary };

// Ported from web's frontend/src/features/events/components/EventCard.tsx —
// same badge/title/location/host layout, adapted to the mobile card shell
// (theme.uiBackground/borderColor) every other feed card uses.
const EventCard = ({ event }: EventCardProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const isCancelled = event.status === "cancelled";
  const hostName = event.hostGroup?.name ?? event.creator.firstName ?? event.creator.name ?? "Someone";

  return (
    <View
      className="w-full overflow-hidden rounded-2xl"
      style={{ backgroundColor: theme.uiBackground, borderWidth: 1, borderColor: theme.borderColor }}
    >
      <PressableScale onPress={() => router.push(`/event-details/${event.id}`)}>
        {event.coverImageUrl ? (
          <View style={{ width: "100%", aspectRatio: 16 / 9 }}>
            <Image source={{ uri: event.coverImageUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          </View>
        ) : null}
        <View className="gap-1.5 p-3.5">
          <View className="flex-row flex-wrap items-center gap-1.5">
            <Badge label={formatEventDateTime(event.startAt, event.endAt)} icon="calendar" tone="brand" />
            {event.eventType === "official" ? <Badge label="Official" icon="checkmark-circle" tone="info" /> : null}
            {isCancelled ? <Badge label="Cancelled" tone="destructive" /> : null}
          </View>
          <Text className="text-sm font-semibold" style={{ color: theme.title }} numberOfLines={2}>
            {event.title}
          </Text>
          {event.location || event.virtualUrl ? (
            <View className="flex-row items-center gap-1.5">
              <Ionicons
                name={event.virtualUrl && !event.location ? "videocam-outline" : "location-outline"}
                size={IconSizes.sm}
                color={theme.tabIconColour}
              />
              <Text className="flex-1 text-sm" style={{ color: theme.text }} numberOfLines={1}>
                {event.location || "Virtual event"}
              </Text>
            </View>
          ) : null}
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="people-outline" size={IconSizes.sm} color={theme.tabIconColour} />
            <Text className="text-xs" style={{ color: theme.tabIconColour }} numberOfLines={1}>
              Hosted by {hostName}
            </Text>
          </View>
        </View>
      </PressableScale>
    </View>
  );
};

export default EventCard;
