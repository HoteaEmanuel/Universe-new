import { useState } from "react";
import { View, Text, TextInput, Image, ActivityIndicator, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getFullName } from "@universe/shared";
import { useGetUserByIdQuery } from "@queryAndMutation/queries/user-queries";
import { useStartConversationMutation } from "@queryAndMutation/mutations/conversation-mutation";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import ThemedView from "@components/ThemedView";
import ConversationEmptyState from "@components/chat/ConversationEmptyState";
import { getAvatarColor, getInitials } from "@utils/chatAvatarColor";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

const HEADER_AVATAR_SIZE = 36;

// Landing screen for messaging a user with no existing DM yet — reached from
// a profile's Message button when useGetConversationByUsersIdsQuery comes
// back empty. Mirrors web's NewConvo.tsx/NewConversationPanel.tsx: header +
// empty state + a single-message composer that creates the conversation on
// send, then hands off to the real thread screen.
const NewConversation = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");

  const { data: user, isPending: isPendingUser } = useGetUserByIdQuery(id);
  const { mutate: startConversation, isPending: isSending } = useStartConversationMutation();

  const fullName = getFullName(user ?? {});
  const canSend = text.trim().length > 0 && !isSending;

  const handleSend = () => {
    if (!canSend || !id) return;
    startConversation(
      { userId: id, message: text.trim() },
      {
        onSuccess: (conversationId: string) => {
          router.replace({
            pathname: "/(chat)/conversation/[id]",
            params: { id: conversationId },
          });
        },
      },
    );
  };

  return (
    <ThemedView safe fullHeight style={{ paddingBottom: 0 }}>
      <View
        className="flex-row items-center gap-3 px-4 pb-3 pt-2"
        style={{ borderBottomWidth: 1, borderBottomColor: theme.borderColor }}
      >
        <PressableScale onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={IconSizes.xl} color={theme.iconMuted} />
        </PressableScale>

        {isPendingUser ? (
          <View
            style={{
              width: HEADER_AVATAR_SIZE,
              height: HEADER_AVATAR_SIZE,
              borderRadius: HEADER_AVATAR_SIZE / 2,
              backgroundColor: theme.uiBackground,
            }}
          />
        ) : user?.profilePicture ? (
          <Image
            source={{ uri: user.profilePicture }}
            style={{
              width: HEADER_AVATAR_SIZE,
              height: HEADER_AVATAR_SIZE,
              borderRadius: HEADER_AVATAR_SIZE / 2,
            }}
          />
        ) : (
          <View
            className="items-center justify-center rounded-full"
            style={{
              width: HEADER_AVATAR_SIZE,
              height: HEADER_AVATAR_SIZE,
              backgroundColor: getAvatarColor(id ?? ""),
            }}
          >
            <Text className="text-xs font-semibold" style={{ color: "#ffffff" }}>
              {getInitials(fullName || "?")}
            </Text>
          </View>
        )}

        <Text className="flex-1 text-base font-bold" style={{ color: theme.title }} numberOfLines={1}>
          {fullName}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View className="flex-1 items-center justify-center">
          {isPendingUser ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <ConversationEmptyState />
          )}
        </View>

        <View
          className="flex-row items-end gap-2 px-4 pt-2.5"
          style={{ paddingBottom: insets.bottom || 12 }}
        >
          <View
            className="flex-1 justify-center rounded-2xl px-3.5"
            style={{ backgroundColor: theme.uiBackground, minHeight: 40 }}
          >
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Send a message"
              placeholderTextColor={theme.tabIconColour}
              multiline
              style={{ color: theme.text, maxHeight: 96, paddingVertical: 9 }}
              className="text-sm"
            />
          </View>
          <PressableScale onPress={handleSend} enabled={canSend} hitSlop={8} className="pb-2">
            <Ionicons name="send" size={IconSizes.lg} color={canSend ? Colors.primary : theme.iconMuted} />
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};

export default NewConversation;
