import { View, Text, Image, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getFullName } from "@universe/shared";
import ThemedView from "@components/ThemedView";
import SettingsScreenHeader from "@components/settings/SettingsScreenHeader";
import SettingsSection from "@components/settings/SettingsSection";
import SettingsRow from "@components/settings/SettingsRow";
import MediaPreviewSection from "@components/chat/MediaPreviewSection";
import {
  useGetUserByConvoId,
  useGetConvoMessagesInfinite,
} from "@queryAndMutation/queries/conversation-queries";
import {
  useArchiveConversationMutation,
  useDeleteConversationMutation,
} from "@queryAndMutation/mutations/conversation-mutation";
import { useBlockUserMutation, useUnblockUserMutation } from "@queryAndMutation/mutations/block-mutation";
import {
  useGetGroupById,
  useGetGroupMemberById,
} from "@queryAndMutation/queries/group-queries";
import { useLeaveGroupMutation, useDeleteGroupMutation } from "@queryAndMutation/mutations/group-mutation";
import { useConfirmDialogStore } from "@store/confirmDialogStore";
import { Colors } from "@constants/colors";
import { PressableScale } from "@lib/styled";
import { getAvatarColor, getInitials } from "@utils/chatAvatarColor";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

const AVATAR_SIZE = 88;

// Reached by tapping the thread header in app/(chat)/conversation/[id].tsx
// (that tap used to jump straight to the other user's profile — moved down
// into the avatar row below instead, see current-feature.md's goals). One
// screen for both DMs and groups, branching on the `isGroup` route param,
// matching the thread screen's own convention.
const ConversationDetails = () => {
  const { id, isGroup: isGroupParam } = useLocalSearchParams<{ id: string; isGroup?: string }>();
  const isGroup = isGroupParam === "1";
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;

  const { data: otherUser, isPending: isPendingUser } = useGetUserByConvoId(isGroup ? undefined : id);
  const { data: convoPages } = useGetConvoMessagesInfinite(isGroup ? undefined : id);
  const viewerBlockedOther = convoPages?.pages[0]?.viewerBlockedOther ?? false;

  const { data: group, isPending: isPendingGroup } = useGetGroupById(isGroup ? id : undefined);
  const { data: member } = useGetGroupMemberById(isGroup ? id : undefined);
  const isAdmin = member?.role === "admin";

  const { mutate: archiveConversation, isPending: isArchiving } = useArchiveConversationMutation();
  const { mutate: deleteConversation, isPending: isDeletingConvo } = useDeleteConversationMutation();
  const { mutate: blockUser, isPending: isBlocking } = useBlockUserMutation();
  const { mutate: unblockUser, isPending: isUnblocking } = useUnblockUserMutation();
  const { mutate: leaveGroup, isPending: isLeaving } = useLeaveGroupMutation();
  const { mutate: deleteGroup, isPending: isDeletingGroup } = useDeleteGroupMutation();

  // Every destructive/leaving action removes this thread from the caller's
  // own list, so there's nothing left to show on the thread screen behind
  // this one — replace back to the Chat tab instead of just popping.
  const backToChatList = () => router.replace("/(dashboard)/chat");

  const name = isGroup ? group?.name ?? "" : getFullName(otherUser) || "";
  const avatarSrc = (isGroup ? group?.coverImageUrl : otherUser?.profilePicture) ?? undefined;
  const isPendingHeader = isGroup ? isPendingGroup : isPendingUser;

  const handleBlockToggle = () => {
    if (!otherUser?.id) return;
    if (viewerBlockedOther) {
      unblockUser(otherUser.id);
      return;
    }
    useConfirmDialogStore.getState().open({
      title: `Block ${name}?`,
      message:
        "They won't be able to message you anymore. This conversation will move out of your chat list. You can unblock them at any time.",
      confirmLabel: "Block",
      destructive: true,
      icon: "ban-outline",
      onConfirm: () => blockUser(otherUser.id, { onSuccess: backToChatList }),
    });
  };

  const handleArchive = () => {
    if (!id) return;
    // No "view archived conversations" screen exists on mobile yet (see
    // current-feature.md), so today this is a one-way trip out of the live
    // list — worth a confirm even though it's non-destructive server-side.
    useConfirmDialogStore.getState().open({
      title: "Archive this conversation?",
      message:
        "It'll move out of your chat list. There's no archived-conversations screen on mobile yet, so you won't be able to view or unarchive it from here until that's built.",
      confirmLabel: "Archive",
      destructive: true,
      icon: "archive-outline",
      onConfirm: () => archiveConversation(id, { onSuccess: backToChatList }),
    });
  };

  const handleDeleteConversation = () => {
    if (!id) return;
    useConfirmDialogStore.getState().open({
      title: "Delete this conversation?",
      message:
        "This removes it from your list. The other person keeps their copy, and it'll reappear if they message you again.",
      confirmLabel: "Delete",
      destructive: true,
      icon: "trash-outline",
      onConfirm: () => deleteConversation(id, { onSuccess: backToChatList }),
    });
  };

  const handleLeaveGroup = () => {
    if (!id) return;
    useConfirmDialogStore.getState().open({
      title: "Leave this group?",
      message: "This can't be undone. You can only rejoin if an admin adds you back.",
      confirmLabel: "Leave group",
      destructive: true,
      icon: "log-out-outline",
      onConfirm: () => leaveGroup(id, { onSuccess: backToChatList }),
    });
  };

  const handleDeleteGroup = () => {
    if (!id) return;
    useConfirmDialogStore.getState().open({
      title: "Delete this group?",
      message:
        "This permanently deletes the group for everyone, including every message and file shared in it. This can't be undone.",
      confirmLabel: "Delete group",
      icon: "trash-outline",
      destructive: true,
      onConfirm: () => deleteGroup(id, { onSuccess: backToChatList }),
    });
  };

  return (
    <ThemedView safe fullHeight>
      <SettingsScreenHeader title={isGroup ? "Group info" : "Conversation info"} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} className="flex-1">
        <PressableAvatar
          isGroup={isGroup}
          name={name}
          avatarSrc={avatarSrc}
          isPending={isPendingHeader}
          seed={id ?? ""}
          onPress={
            !isGroup && otherUser?.id ? () => router.push(`/profile/${otherUser.id}`) : undefined
          }
        />
        {isGroup && group?.description ? (
          <Text
            className="px-8 pb-6 pt-1 text-center text-sm"
            style={{ color: theme.text }}
          >
            {group.description}
          </Text>
        ) : null}

        <View className="gap-section px-gutter pt-section">
          {id ? <MediaPreviewSection id={id} isGroup={isGroup} /> : null}

          {isGroup ? (
            <SettingsSection>
              <SettingsRow
                title="Members"
                icon="people-outline"
                onPress={() => router.push({ pathname: "/(chat)/members/[id]", params: { id: id ?? "" } })}
              />
            </SettingsSection>
          ) : null}

          <SettingsSection title={isGroup ? "Group options" : "Conversation options"}>
            {isGroup ? (
              <>
                <SettingsRow
                  title={isLeaving ? "Leaving..." : "Leave group"}
                  icon="log-out-outline"
                  danger
                  onPress={handleLeaveGroup}
                />
                {isAdmin ? (
                  <SettingsRow
                    title={isDeletingGroup ? "Deleting..." : "Delete group"}
                    icon="trash-outline"
                    danger
                    onPress={handleDeleteGroup}
                  />
                ) : null}
              </>
            ) : (
              <>
                <SettingsRow
                  title={isArchiving ? "Archiving..." : "Archive conversation"}
                  icon="archive-outline"
                  onPress={handleArchive}
                />
                <SettingsRow
                  title={
                    viewerBlockedOther
                      ? isUnblocking
                        ? "Unblocking..."
                        : "Unblock user"
                      : isBlocking
                        ? "Blocking..."
                        : "Block user"
                  }
                  icon={viewerBlockedOther ? "shield-checkmark-outline" : "ban-outline"}
                  danger={!viewerBlockedOther}
                  onPress={handleBlockToggle}
                />
                <SettingsRow
                  title={isDeletingConvo ? "Deleting..." : "Delete conversation"}
                  icon="trash-outline"
                  danger
                  onPress={handleDeleteConversation}
                />
              </>
            )}
          </SettingsSection>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

type PressableAvatarProps = {
  isGroup: boolean;
  name: string;
  avatarSrc?: string;
  isPending: boolean;
  seed: string;
  onPress?: () => void;
};

const PressableAvatar = ({ isGroup, name, avatarSrc, isPending, seed, onPress }: PressableAvatarProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;

  const content = (
    <View className="items-center gap-3 px-gutter pb-6 pt-4">
      {isPending ? (
        <View
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: isGroup ? 20 : AVATAR_SIZE / 2,
            backgroundColor: theme.uiBackground,
          }}
        />
      ) : avatarSrc ? (
        <Image
          source={{ uri: avatarSrc }}
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: isGroup ? 20 : AVATAR_SIZE / 2,
          }}
        />
      ) : (
        <View
          className="items-center justify-center"
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: isGroup ? 20 : AVATAR_SIZE / 2,
            backgroundColor: getAvatarColor(seed),
          }}
        >
          <Text className="text-2xl font-semibold" style={{ color: "#ffffff" }}>
            {getInitials(name || "?")}
          </Text>
        </View>
      )}
      <Text className="text-xl font-bold" style={{ color: theme.title }}>
        {name}
      </Text>
      {!isGroup && onPress ? (
        <View className="flex-row items-center gap-1">
          <Text className="text-sm font-medium" style={{ color: Colors.primary }}>
            View profile
          </Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </View>
      ) : null}
    </View>
  );

  if (!onPress) return content;

  return <PressableScale onPress={onPress}>{content}</PressableScale>;
};

export default ConversationDetails;
