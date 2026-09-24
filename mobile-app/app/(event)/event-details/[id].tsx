import { View, Text, Image, ScrollView, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@store/authStore";
import { useGetEventQuery } from "@queryAndMutation/queries/event-queries";
import { useGetGroupById } from "@queryAndMutation/queries/group-queries";
import {
  useRsvpEventMutation,
  useCancelRsvpMutation,
  useJoinEventChatMutation,
  useCancelEventMutation,
} from "@queryAndMutation/mutations/event-mutation";
import { useConfirmDialogStore } from "@store/confirmDialogStore";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import ThemedView from "@components/ThemedView";
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

const EventDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const currentUserId = useAuthStore((state) => state.user?.id);

  const { data: event, isPending } = useGetEventQuery(id);
  const rsvpMutation = useRsvpEventMutation(id);
  const cancelRsvpMutation = useCancelRsvpMutation(id);
  const joinChatMutation = useJoinEventChatMutation(id);
  const cancelEventMutation = useCancelEventMutation(id);
  const rsvpPending = rsvpMutation.isPending || cancelRsvpMutation.isPending;

  // GET /groups/:id is member-gated on the backend (requireGroupMembership),
  // so a successful fetch here doubles as "am I already in this chat" —
  // no separate membership field exists on EventDetails to check instead.
  const coordinationGroupId = event?.coordinationGroup?.id;
  const { data: coordinationGroup, isPending: coordinationGroupPending } =
    useGetGroupById(coordinationGroupId);
  const isChatMember = !!coordinationGroup;

  const goToChat = (groupId: string, title?: string) =>
    router.push({
      pathname: "/(chat)/conversation/[id]",
      params: { id: groupId, title, isGroup: "1" },
    });

  const handleRsvp = (status: "going" | "interested") => {
    if (event?.viewerParticipation?.status === status) {
      cancelRsvpMutation.mutate();
    } else {
      rsvpMutation.mutate(status);
    }
  };

  const handleJoinChat = () => {
    joinChatMutation.mutate(undefined, {
      onSuccess: (group) => goToChat(group.id, event ? `${event.title} - Chat` : undefined),
    });
  };

  const handleCancelEvent = () => {
    useConfirmDialogStore.getState().open({
      title: "Cancel this event?",
      message: "All participants will be notified. This can't be undone.",
      confirmLabel: "Cancel event",
      cancelLabel: "Keep event",
      destructive: true,
      onConfirm: () => cancelEventMutation.mutate(),
    });
  };

  if (isPending) {
    return (
      <ThemedView safe className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </ThemedView>
    );
  }

  if (!event) {
    return (
      <ThemedView safe className="flex-1 items-center justify-center gap-2 px-8">
        <Ionicons name="calendar-outline" size={40} color={theme.iconMuted} />
        <Text className="text-base font-semibold" style={{ color: theme.title }}>
          Event not found
        </Text>
        <Text className="text-center text-sm" style={{ color: theme.tabIconColour }}>
          This event may have been deleted or the link might be broken.
        </Text>
      </ThemedView>
    );
  }

  const isCancelled = event.status === "cancelled";
  const isHost = event.creatorId === currentUserId;
  const viewerStatus = event.viewerParticipation?.status;
  const hostName = event.hostGroup?.name ?? event.creator.firstName ?? event.creator.name ?? "Someone";
  const goToHost = () => {
    if (event.hostGroup) {
      goToChat(event.hostGroup.id, event.hostGroup.name);
    } else {
      router.push(event.creatorId === currentUserId ? "/profile" : `/profile/${event.creatorId}`);
    }
  };

  return (
    <ThemedView safe fullHeight style={{ paddingBottom: 0 }}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="flex-row items-center px-4 pt-2">
          <PressableScale onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={IconSizes.xl} color={theme.iconMuted} />
          </PressableScale>
        </View>

        {event.coverImageUrl ? (
          <View className="mx-4 mt-2 overflow-hidden rounded-2xl" style={{ aspectRatio: 16 / 9 }}>
            <Image source={{ uri: event.coverImageUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          </View>
        ) : null}

        <View className="gap-3 px-4 pt-4">
          <View className="flex-row flex-wrap items-center gap-1.5">
            <Badge label={formatEventDateTime(event.startAt, event.endAt)} icon="calendar" tone="brand" />
            {event.eventType === "official" ? <Badge label="Official" icon="checkmark-circle" tone="info" /> : null}
            {isCancelled ? <Badge label="Cancelled" tone="destructive" /> : null}
          </View>

          <View className="gap-1">
            <Text className="text-2xl font-bold" style={{ color: theme.title }}>
              {event.title}
            </Text>
            <PressableScale onPress={goToHost} className="flex-row items-center gap-1.5 self-start">
              <Ionicons name="people-outline" size={IconSizes.sm} color={theme.tabIconColour} />
              <Text className="text-sm" style={{ color: theme.tabIconColour }}>
                Hosted by {hostName}
              </Text>
            </PressableScale>
          </View>

          {event.description ? (
            <Text className="text-sm" style={{ color: theme.text }}>
              {event.description}
            </Text>
          ) : null}

          <View className="gap-2 rounded-2xl p-4" style={{ borderWidth: 1, borderColor: theme.borderColor }}>
            {event.location ? (
              <View className="flex-row items-center gap-2">
                <Ionicons name="location-outline" size={IconSizes.md} color={theme.tabIconColour} />
                <Text className="flex-1 text-sm" style={{ color: theme.text }}>
                  {event.location}
                </Text>
              </View>
            ) : null}
            {event.virtualUrl ? (
              <View className="flex-row items-center gap-2">
                <Ionicons name="videocam-outline" size={IconSizes.md} color={Colors.primary} />
                <Text className="flex-1 text-sm" style={{ color: Colors.primary }}>
                  Join virtually
                </Text>
              </View>
            ) : null}
            <View className="flex-row items-center gap-2">
              <Ionicons name="people-outline" size={IconSizes.md} color={theme.tabIconColour} />
              <Text className="flex-1 text-sm" style={{ color: theme.text }}>
                {event.counts.going} going
                {event.capacity ? ` / ${event.capacity} spots` : ""}
                {event.counts.interested > 0 ? ` · ${event.counts.interested} interested` : ""}
                {event.counts.waitlisted > 0 ? ` · ${event.counts.waitlisted} waitlisted` : ""}
              </Text>
            </View>
          </View>

          {!isCancelled ? (
            <View className="flex-row flex-wrap items-center gap-2.5">
              <PressableScale
                onPress={() => handleRsvp("going")}
                enabled={!rsvpPending}
                className="rounded-full px-4 py-2.5"
                style={{
                  backgroundColor: viewerStatus === "going" ? Colors.primary : "transparent",
                  borderWidth: 1,
                  borderColor: viewerStatus === "going" ? Colors.primary : theme.borderColor,
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: viewerStatus === "going" ? "#ffffff" : theme.text }}
                >
                  {viewerStatus === "going" ? "Going ✓" : "Going"}
                </Text>
              </PressableScale>
              <PressableScale
                onPress={() => handleRsvp("interested")}
                enabled={!rsvpPending}
                className="rounded-full px-4 py-2.5"
                style={{
                  backgroundColor: viewerStatus === "interested" ? Colors.primary : "transparent",
                  borderWidth: 1,
                  borderColor: viewerStatus === "interested" ? Colors.primary : theme.borderColor,
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: viewerStatus === "interested" ? "#ffffff" : theme.text }}
                >
                  {viewerStatus === "interested" ? "Interested ✓" : "Interested"}
                </Text>
              </PressableScale>
              {viewerStatus === "waitlisted" ? (
                <View
                  className="rounded-full px-4 py-2.5"
                  style={{ borderWidth: 1, borderColor: theme.borderColor }}
                >
                  <Text className="text-xs font-bold" style={{ color: theme.tabIconColour }}>
                    Waitlisted
                  </Text>
                </View>
              ) : null}
              {event.coordinationGroup && !coordinationGroupPending && (viewerStatus || isHost) ? (
                <PressableScale
                  onPress={
                    isChatMember
                      ? () =>
                          goToChat(
                            event.coordinationGroup!.id,
                            `${event.title} - Chat`,
                          )
                      : handleJoinChat
                  }
                  enabled={!joinChatMutation.isPending}
                  className="flex-row items-center gap-1.5 rounded-full px-4 py-2.5"
                >
                  <Ionicons name="chatbubble-outline" size={IconSizes.sm} color={Colors.primary} />
                  <Text className="text-xs font-bold" style={{ color: Colors.primary }}>
                    {isChatMember ? "Go to chat" : "Join event chat"}
                  </Text>
                </PressableScale>
              ) : null}
              {!event.coordinationGroup && isHost ? (
                <PressableScale
                  onPress={handleJoinChat}
                  enabled={!joinChatMutation.isPending}
                  className="flex-row items-center gap-1.5 rounded-full px-4 py-2.5"
                >
                  <Ionicons name="chatbubble-outline" size={IconSizes.sm} color={Colors.primary} />
                  <Text className="text-xs font-bold" style={{ color: Colors.primary }}>
                    Start event chat
                  </Text>
                </PressableScale>
              ) : null}
            </View>
          ) : null}

          {isHost && !isCancelled ? (
            <View
              className="flex-row justify-end pt-4"
              style={{ borderTopWidth: 1, borderTopColor: theme.borderColor }}
            >
              <PressableScale
                onPress={() => router.push(`/edit-event/${event.id}`)}
                className="flex-row items-center gap-1.5 px-2 py-1.5"
              >
                <Ionicons name="pencil-outline" size={IconSizes.sm} color={theme.tabIconColour} />
                <Text className="text-xs font-semibold" style={{ color: theme.tabIconColour }}>
                  Edit event
                </Text>
              </PressableScale>
              <PressableScale
                onPress={handleCancelEvent}
                enabled={!cancelEventMutation.isPending}
                className="flex-row items-center gap-1.5 px-2 py-1.5"
              >
                <Ionicons name="ban-outline" size={IconSizes.sm} color={Colors.warning} />
                <Text className="text-xs font-semibold" style={{ color: Colors.warning }}>
                  Cancel event
                </Text>
              </PressableScale>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default EventDetails;
