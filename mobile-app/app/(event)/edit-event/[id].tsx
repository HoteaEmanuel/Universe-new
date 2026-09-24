import { View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@store/authStore";
import { useGetEventQuery } from "@queryAndMutation/queries/event-queries";
import ThemedView from "@components/ThemedView";
import EventForm from "@components/events/EventForm";
import { Colors } from "@constants/colors";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

const EditEvent = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const currentUserId = useAuthStore((state) => state.user?.id);

  const { data: event, isPending } = useGetEventQuery(id);

  if (isPending) {
    return (
      <ThemedView safe className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </ThemedView>
    );
  }

  if (!event || event.creatorId !== currentUserId) {
    return (
      <ThemedView safe className="flex-1 items-center justify-center gap-2 px-8">
        <Ionicons name="lock-closed-outline" size={40} color={theme.iconMuted} />
        <Text className="text-base font-semibold" style={{ color: theme.title }}>
          Can't edit this event
        </Text>
        <Text className="text-center text-sm" style={{ color: theme.tabIconColour }}>
          Only the event's creator can edit it.
        </Text>
      </ThemedView>
    );
  }

  return <EventForm mode="edit" event={event} />;
};

export default EditEvent;
