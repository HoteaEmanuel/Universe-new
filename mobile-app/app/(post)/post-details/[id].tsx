import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { formatDateDetailed, formatCount } from "@universe/shared";
import { useAuthStore } from "@store/authStore";
import {
  useGetPostQuery,
  usePostUserQuery,
  useGetLikesQuery,
  usePostLikedQuery,
  useGetRelevantLikerQuery,
} from "@queryAndMutation/queries/post-queries";
import { useGetPostCommentsCount } from "@queryAndMutation/queries/comments-queries";
import { useLikeMutation, useUnlikeMutation } from "@queryAndMutation/mutations/post-mutation";
import { useIsFollowingQuery } from "@queryAndMutation/queries/user-queries";
import { useFollowMutation, useUnfollowMutation } from "@queryAndMutation/mutations/user-mutation";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import ThemedView from "@components/ThemedView";
import UserAvatar from "@components/UserAvatar";
import PostImageCarousel from "@components/post/PostImageCarousel";
import AnimatedLikeButton from "@components/post/AnimatedLikeButton";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

const PostDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const currentUserId = useAuthStore((state) => state.user?.id);

  const { data: post, isPending: postPending } = useGetPostQuery(id);
  const { data: creator, isPending: creatorPending } = usePostUserQuery(post?.userId ?? "");
  const { data: liked, isPending: likedPending } = usePostLikedQuery(id);
  const { data: likes, isPending: likesPending } = useGetLikesQuery(id);
  const { data: relevantLiker, isPending: relevantLikerPending } = useGetRelevantLikerQuery(id);
  const { data: commentsCount, isPending: commentsPending } = useGetPostCommentsCount(id);
  const { data: isFollowing, isPending: followingPending } = useIsFollowingQuery(post?.userId);

  const likeMutation = useLikeMutation(id);
  const unlikeMutation = useUnlikeMutation(id);
  const followMutation = useFollowMutation(post?.userId, currentUserId);
  const unfollowMutation = useUnfollowMutation(post?.userId, currentUserId);

  const isPending =
    postPending ||
    creatorPending ||
    likedPending ||
    likesPending ||
    relevantLikerPending ||
    commentsPending ||
    followingPending;

  const handleLike = () => {
    if (liked) unlikeMutation.mutate();
    else likeMutation.mutate();
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

  return (
    <ThemedView safe fullHeight>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="flex-row items-center justify-between px-4 pt-2">
          <PressableScale onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={IconSizes.xl} color={theme.iconMuted} />
          </PressableScale>
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

        <View
          className="mx-4 mt-4 rounded-2xl border p-4"
          style={{ borderColor: theme.borderColor }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold" style={{ color: theme.title }}>
              Comments
            </Text>
            {!!commentsCount && (
              <Text className="text-xs" style={{ color: theme.tabIconColour }}>
                {formatCount(commentsCount)}
              </Text>
            )}
          </View>
          <Text className="pt-6 text-center text-sm" style={{ color: theme.tabIconColour }}>
            The comment thread is coming to this screen soon.
          </Text>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default PostDetails;
