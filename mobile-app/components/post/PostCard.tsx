import { useState, type ReactNode } from "react";
import { View, Text, Pressable, Share, useColorScheme, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { formatDateDetailed, formatCount, type Post } from "@universe/shared";
import { useAuthStore } from "../../store/authStore";
import {
  usePostUserQuery,
  useGetLikesQuery,
  usePostLikedQuery,
  useGetRelevantLikerQuery,
} from "../../queryAndMutation/queries/post-queries";
import { useGetPostCommentsCount } from "../../queryAndMutation/queries/comments-queries";
import { useLikeMutation, useUnlikeMutation } from "../../queryAndMutation/mutations/post-mutation";
import { useIsFollowingQuery } from "../../queryAndMutation/queries/user-queries";
import {
  useFollowMutation,
  useUnfollowMutation,
  useToggleSavePostMutation,
} from "../../queryAndMutation/mutations/user-mutation";
import { Colors } from "../../constants/colors";
import { IconSizes } from "../../constants/iconSizes";
import { PressableScale } from "../../lib/styled";
import UserAvatar from "../UserAvatar";
import PostImageCarousel from "./PostImageCarousel";

type PostCardProps = {
  post: Post;
};

const PostCard = ({ post }: PostCardProps) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  // The rest of the app (ThemedView/ThemedText) still runs on this legacy
  // palette rather than Uniwind's newer semantic tokens (bg-card,
  // text-foreground, ...) — using those here made the card visibly mismatch
  // the page background it actually renders on, so colors are pulled from
  // `theme` instead, same as every other themed screen.
  const cardBg = theme.uiBackground;
  const border = theme.borderColor;
  const textPrimary = theme.title;
  const textBody = theme.text;
  const textMuted = theme.tabIconColour;
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isOwnPost = post.userId === currentUserId;

  const [showMore, setShowMore] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [isSaved, setIsSaved] = useState(post.isSaved);

  const { data: creator, isPending: creatorPending } = usePostUserQuery(post.userId);
  const { data: liked, isPending: likedPending } = usePostLikedQuery(post.id);
  const { data: isFollowing, isPending: followingPending } = useIsFollowingQuery(post.userId);
  const { data: likes, isPending: likesPending } = useGetLikesQuery(post.id);
  const { data: relevantLiker, isPending: relevantLikerPending } = useGetRelevantLikerQuery(
    post.id,
  );
  const { data: commentsCount, isPending: commentsPending } = useGetPostCommentsCount(post.id);

  const likeMutation = useLikeMutation(post.id);
  const unlikeMutation = useUnlikeMutation(post.id);
  const followMutation = useFollowMutation(post.userId, currentUserId);
  const unfollowMutation = useUnfollowMutation(post.userId, currentUserId);
  const { mutate: toggleSavePost } = useToggleSavePostMutation(post.id, currentUserId);

  const isPending =
    creatorPending ||
    likedPending ||
    followingPending ||
    likesPending ||
    relevantLikerPending ||
    commentsPending;

  const handleLike = () => {
    if (liked) unlikeMutation.mutate();
    else likeMutation.mutate();
  };

  const handleSave = () => {
    const next = !isSaved;
    setIsSaved(next);
    toggleSavePost(undefined, { onError: () => setIsSaved(!next) });
  };

  const handleShare = async () => {
    const message = [post.title, post.body].filter(Boolean).join("\n\n");
    try {
      await Share.share({ message });
    } catch {
      // Share sheet dismissed or failed — nothing to recover.
    }
  };

  const goToPost = () => router.push(`/post-details/${post.id}`);
  const goToComments = () => router.push(`/comments/${post.id}`);
  const goToProfile = () => router.push(isOwnPost ? "/profile" : `/profile/${post.userId}`);

  if (isPending) {
    return (
      <View
        className="h-72 w-full items-center justify-center rounded-2xl"
        style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border }}
      >
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!creator) return null;

  const displayName =
    [creator.firstName, creator.lastName].filter(Boolean).join(" ") || creator.name || "Unknown";
  const hasImages = !!post.imagesUrls?.length;

  const caption: ReactNode =
    post.title || post.body ? (
      <View className="gap-1 px-4">
        {post.title ? (
          <Text className="text-sm font-semibold" style={{ color: textPrimary }}>
            {post.title}
          </Text>
        ) : null}
        {post.body ? (
          <>
            <Text
              numberOfLines={showMore ? undefined : 3}
              onTextLayout={(event) => {
                if (!showMore && event.nativeEvent.lines.length > 3) setIsTruncated(true);
              }}
              className="text-sm"
              style={{ color: textBody }}
            >
              {post.body}
            </Text>
            {isTruncated ? (
              <Pressable
                onPress={() => setShowMore((value) => !value)}
                hitSlop={4}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <Text className="text-xs" style={{ color: textMuted }}>
                  {showMore ? "See less" : "See more"}
                </Text>
              </Pressable>
            ) : null}
          </>
        ) : null}
      </View>
    ) : null;

  return (
    <View
      className="w-full overflow-hidden rounded-2xl shadow-card"
      style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border }}
    >
      <View className="flex-row items-center gap-3 px-4 py-3">
        <UserAvatar user={creator} size={36} iconColor={theme.iconMuted} onPress={goToProfile} />
        <Pressable
          onPress={goToProfile}
          className="flex-1"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text className="text-sm font-semibold" style={{ color: textPrimary }} numberOfLines={1}>
            {displayName}
          </Text>
          <Text className="text-xs" style={{ color: textMuted }} numberOfLines={1}>
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
                ? { borderWidth: 1, borderColor: border }
                : { backgroundColor: Colors.primary }
            }
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: isFollowing ? textMuted : "#ffffff" }}
            >
              {isFollowing ? "Following" : "Follow"}
            </Text>
          </PressableScale>
        ) : null}
      </View>

      {!hasImages ? caption : null}
      {!hasImages && caption ? <View className="h-3" /> : null}

      {hasImages ? (
        <Pressable onPress={goToPost} style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
          <PostImageCarousel images={post.imagesUrls} />
        </Pressable>
      ) : null}

      <View className="flex-row items-center gap-5 px-4 pt-3">
        <PressableScale onPress={handleLike} hitSlop={6}>
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={IconSizes["2xl"]}
            color={liked ? Colors.like : theme.iconMuted}
          />
        </PressableScale>
        <PressableScale onPress={goToComments} hitSlop={6}>
          <Ionicons name="chatbubble-outline" size={IconSizes.xl} color={theme.iconMuted} />
        </PressableScale>
        <PressableScale onPress={handleShare} hitSlop={6}>
          <Ionicons name="paper-plane-outline" size={IconSizes.xl} color={theme.iconMuted} />
        </PressableScale>

        {!isOwnPost ? (
          <PressableScale onPress={handleSave} hitSlop={6} className="ml-auto">
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={IconSizes.xl}
              color={isSaved ? theme.title : theme.iconMuted}
            />
          </PressableScale>
        ) : null}
      </View>

      <View className="gap-1 px-4 pt-2">
        {relevantLiker ? (
          <View className="flex-row items-center gap-1.5">
            <UserAvatar user={relevantLiker} size={16} iconColor={theme.iconMuted} />
            <Text className="flex-1 text-sm" style={{ color: textBody }} numberOfLines={1}>
              Liked by{" "}
              <Text className="font-semibold" style={{ color: textPrimary }}>
                {relevantLiker.firstName || relevantLiker.name}
              </Text>
              {!!likes && likes > 1
                ? ` and ${formatCount(likes - 1)} other${likes - 1 === 1 ? "" : "s"}`
                : ""}
            </Text>
          </View>
        ) : (
          <Text className="text-sm font-semibold" style={{ color: textPrimary }}>
            {formatCount(likes ?? 0)} {likes === 1 ? "like" : "likes"}
          </Text>
        )}

        {!!commentsCount && commentsCount > 0 ? (
          <Pressable
            onPress={goToComments}
            hitSlop={4}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text className="text-sm" style={{ color: textMuted }}>
              View {formatCount(commentsCount)} {commentsCount === 1 ? "comment" : "comments"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {hasImages && caption ? <View className="pt-2">{caption}</View> : null}

      {post.tags?.length > 0 ? (
        <View className="flex-row flex-wrap gap-2 px-4 pb-4 pt-3">
          {post.tags.map((tag) => (
            <View key={tag} className="rounded-full px-2.5 py-1" style={{ backgroundColor: border }}>
              <Text className="text-2xs" style={{ color: textMuted }}>
                #{tag}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View className="pb-3" />
      )}
    </View>
  );
};

export default PostCard;
