import { useState } from "react";
import { View, Text, Pressable, FlatList, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatDateDetailed, formatCount, type PostComment } from "@universe/shared";
import { useAuthStore } from "@store/authStore";
import { useConfirmDialogStore } from "@store/confirmDialogStore";
import {
  useGetPostQuery,
  usePostUserQuery,
  useGetLikesQuery,
  usePostLikedQuery,
  useGetRelevantLikerQuery,
} from "@queryAndMutation/queries/post-queries";
import {
  useGetPostCommentsInfinite,
  useGetPostCommentsCount,
} from "@queryAndMutation/queries/comments-queries";
import {
  useLikeMutation,
  useUnlikeMutation,
  useDeletePostMutation,
} from "@queryAndMutation/mutations/post-mutation";
import { useIsFollowingQuery } from "@queryAndMutation/queries/user-queries";
import { useFollowMutation, useUnfollowMutation } from "@queryAndMutation/mutations/user-mutation";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import ThemedView from "@components/ThemedView";
import UserAvatar from "@components/UserAvatar";
import PostImageCarousel from "@components/post/PostImageCarousel";
import AnimatedLikeButton from "@components/post/AnimatedLikeButton";
import OpportunitySummary from "@components/opportunities/OpportunitySummary";
import Comment from "@components/comments/Comment";
import CommentInput from "@components/comments/CommentInput";
import ActionSheetModal from "@components/ActionSheetModal";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

const PostDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const insets = useSafeAreaInsets();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const { data: post, isPending: postPending } = useGetPostQuery(id);
  const { data: creator, isPending: creatorPending } = usePostUserQuery(post?.userId ?? "");
  const { data: liked, isPending: likedPending } = usePostLikedQuery(id);
  const { data: likes, isPending: likesPending } = useGetLikesQuery(id);
  const { data: relevantLiker, isPending: relevantLikerPending } = useGetRelevantLikerQuery(id);
  const { data: commentsCount } = useGetPostCommentsCount(id);
  const { data: isFollowing, isPending: followingPending } = useIsFollowingQuery(post?.userId);
  const {
    data: commentsData,
    isPending: commentsPending,
    fetchNextPage: fetchNextCommentsPage,
    hasNextPage: hasNextCommentsPage,
    isFetchingNextPage: isFetchingNextCommentsPage,
  } = useGetPostCommentsInfinite(id);

  const likeMutation = useLikeMutation(id);
  const unlikeMutation = useUnlikeMutation(id);
  const followMutation = useFollowMutation(post?.userId, currentUserId);
  const unfollowMutation = useUnfollowMutation(post?.userId, currentUserId);
  const deletePostMutation = useDeletePostMutation(id, currentUserId);
  const [menuVisible, setMenuVisible] = useState(false);

  const isPending =
    postPending ||
    creatorPending ||
    likedPending ||
    likesPending ||
    relevantLikerPending ||
    followingPending;

  const handleLike = () => {
    if (liked) unlikeMutation.mutate();
    else likeMutation.mutate();
  };

  const handleDelete = () => {
    useConfirmDialogStore.getState().open({
      title: "Delete this post?",
      message: "This action cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: () => {
        deletePostMutation.mutate();
        router.back();
      },
    });
  };

  if (isPending) {
    return (
      <ThemedView safe className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </ThemedView>
    );
  }

  if (!post || !creator) {
    return (
      <ThemedView safe className="flex-1 items-center justify-center gap-2 px-8">
        <Ionicons name="image-outline" size={40} color={theme.iconMuted} />
        <Text className="text-base font-semibold" style={{ color: theme.title }}>
          Post not found
        </Text>
        <Text className="text-center text-sm" style={{ color: theme.tabIconColour }}>
          This post may have been deleted or the link might be broken.
        </Text>
      </ThemedView>
    );
  }

  const isOwnPost = post.userId === currentUserId;
  const displayName =
    [creator.firstName, creator.lastName].filter(Boolean).join(" ") || creator.name || "Unknown";
  const hasImages = !!post.imagesUrls?.length;
  const goToProfile = () => router.push(isOwnPost ? "/profile" : `/profile/${post.userId}`);

  const comments = commentsData?.pages.flatMap((page) => page.comments) ?? [];

  const header = (
    <>
      <View className="flex-row items-center justify-between px-4 pt-2">
        <PressableScale onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={IconSizes.xl} color={theme.iconMuted} />
        </PressableScale>
        {isOwnPost ? (
          <PressableScale onPress={() => setMenuVisible(true)} hitSlop={8}>
            <Ionicons name="ellipsis-horizontal" size={IconSizes.xl} color={theme.iconMuted} />
          </PressableScale>
        ) : null}
      </View>

      <View className="flex-row items-center gap-3 px-4 py-3">
        <UserAvatar user={creator} size={36} iconColor={theme.iconMuted} onPress={goToProfile} />
        <Pressable
          onPress={goToProfile}
          className="flex-1"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text className="text-sm font-semibold" style={{ color: theme.title }} numberOfLines={1}>
            {displayName}
          </Text>
          <Text className="text-xs" style={{ color: theme.tabIconColour }} numberOfLines={1}>
            {formatDateDetailed(post.createdAt)}
            {post.location ? ` · ${post.location}` : ""}
          </Text>
        </Pressable>

        {!isOwnPost ? (
          <PressableScale
            onPress={() => (isFollowing ? unfollowMutation.mutate() : followMutation.mutate())}
            className="rounded-full px-3 py-1.5"
            style={
              isFollowing
                ? { borderWidth: 1, borderColor: theme.borderColor }
                : { backgroundColor: Colors.primary }
            }
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: isFollowing ? theme.tabIconColour : "#ffffff" }}
            >
              {isFollowing ? "Following" : "Follow"}
            </Text>
          </PressableScale>
        ) : null}
      </View>

      {post.type === "opportunity" ? (
        <OpportunitySummary post={post} isOwner={isOwnPost} />
      ) : null}

      {hasImages ? <PostImageCarousel images={post.imagesUrls} /> : null}

      {post.title || post.body ? (
        <View className="gap-1 px-4 pt-3">
          {post.title ? (
            <Text className="text-sm font-semibold" style={{ color: theme.title }}>
              {post.title}
            </Text>
          ) : null}
          {post.body ? (
            <Text className="text-sm" style={{ color: theme.text }}>
              {post.body}
            </Text>
          ) : null}
        </View>
      ) : null}

      {post.tags?.length > 0 ? (
        <View className="flex-row flex-wrap gap-2 px-4 pt-3">
          {post.tags.map((tag) => (
            <View
              key={tag}
              className="rounded-full px-2.5 py-1"
              style={{ backgroundColor: theme.borderColor }}
            >
              <Text className="text-2xs" style={{ color: theme.tabIconColour }}>
                #{tag}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View className="flex-row items-center gap-5 px-4 pt-4">
        <AnimatedLikeButton
          liked={!!liked}
          onPress={handleLike}
          color={Colors.like}
          mutedColor={theme.iconMuted}
        />
        <Ionicons name="chatbubble-outline" size={IconSizes.xl} color={theme.iconMuted} />
      </View>

      <View className="gap-1 px-4 pt-2">
        {relevantLiker ? (
          <View className="flex-row items-center gap-1.5">
            <UserAvatar user={relevantLiker} size={16} iconColor={theme.iconMuted} />
            <Text className="flex-1 text-sm" style={{ color: theme.text }} numberOfLines={1}>
              Liked by{" "}
              <Text className="font-semibold" style={{ color: theme.title }}>
                {relevantLiker.firstName || relevantLiker.name}
              </Text>
              {!!likes && likes > 1
                ? ` and ${formatCount(likes - 1)} other${likes - 1 === 1 ? "" : "s"}`
                : ""}
            </Text>
          </View>
        ) : (
          <Text className="text-sm font-semibold" style={{ color: theme.title }}>
            {formatCount(likes ?? 0)} {likes === 1 ? "like" : "likes"}
          </Text>
        )}
      </View>

      <View className="flex-row items-center justify-between px-4 pb-2 pt-5">
        <Text className="text-sm font-semibold" style={{ color: theme.title }}>
          Comments
        </Text>
        {!!commentsCount && (
          <Text className="text-xs" style={{ color: theme.tabIconColour }}>
            {formatCount(commentsCount)}
          </Text>
        )}
      </View>
    </>
  );

  return (
    <ThemedView safe fullHeight style={{ paddingBottom: 0 }}>
      <FlatList<PostComment>
        className="flex-1"
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-4">
            <Comment comment={item} postId={id} />
          </View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          commentsPending ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 16 }} />
          ) : (
            <Text
              className="px-4 pt-2 text-center text-sm"
              style={{ color: theme.tabIconColour }}
            >
              No comments yet — start the conversation.
            </Text>
          )
        }
        ListFooterComponent={
          isFetchingNextCommentsPage ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 12 }} />
          ) : null
        }
        onEndReached={() => {
          if (hasNextCommentsPage && !isFetchingNextCommentsPage) fetchNextCommentsPage();
        }}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      />

      <KeyboardStickyView>
        <View
          style={{
            backgroundColor: theme.background,
            borderTopWidth: 1,
            borderTopColor: theme.borderColor,
            paddingBottom: insets.bottom,
          }}
        >
          <CommentInput postId={id} />
        </View>
      </KeyboardStickyView>

      {isOwnPost ? (
        <ActionSheetModal
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          items={[
            {
              key: "edit",
              label: "Edit post",
              icon: "create-outline",
              onPress: () => router.push(`/edit-post/${id}`),
            },
            {
              key: "delete",
              label: "Delete post",
              icon: "trash-outline",
              destructive: true,
              onPress: handleDelete,
            },
          ]}
        />
      ) : null}
    </ThemedView>
  );
};

export default PostDetails;
