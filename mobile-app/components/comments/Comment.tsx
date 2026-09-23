import { useState } from "react";
import { View, Text } from "react-native";
import { formatDateDetailed, getFullName, type PostComment } from "@universe/shared";
import { useAuthStore } from "@store/authStore";
import { useGetUserByIdQuery } from "@queryAndMutation/queries/user-queries";
import {
  useLikeCommentMutation,
  useRemoveLikeCommentMutation,
} from "@queryAndMutation/mutations/comment-mutation";
import { Colors } from "@constants/colors";
import { PressableScale } from "@lib/styled";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import UserAvatar from "@components/UserAvatar";
import CommentLikeButton from "./CommentLikeButton";
import CommentReplies from "./CommentReplies";
import ReplyInput from "./ReplyInput";

type CommentProps = {
  comment: PostComment;
  postId: string;
};

const Comment = ({ comment, postId }: CommentProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isReply = !!comment.parentId;

  const { data: user, isPending: isPendingUser } = useGetUserByIdQuery(
    comment.isBlocked ? undefined : (comment.userId ?? undefined),
  );

  const [liked, setLiked] = useState(comment.isLiked);
  const [likesCount, setLikesCount] = useState(comment.likesCount);
  const [repliesCount, setRepliesCount] = useState(comment.repliesCount ?? 0);
  const [repliesExpanded, setRepliesExpanded] = useState(false);
  const [replyBoxOpen, setReplyBoxOpen] = useState(false);

  const likeComment = useLikeCommentMutation(postId, comment.parentId);
  const removeLikeComment = useRemoveLikeCommentMutation(postId, comment.parentId);

  if (!comment.isBlocked && (isPendingUser || !user)) return null;

  const isOwnComment = !comment.isBlocked && currentUserId === user?.id;
  const displayName = comment.isBlocked ? "" : isOwnComment ? "You" : getFullName(user);
  const avatarSize = isReply ? 24 : 32;
  const heartSize = isReply ? 12 : 14;

  const handleToggleLike = () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((count) => count + (nextLiked ? 1 : -1));
    if (nextLiked) {
      likeComment.mutate(comment.id, {
        onError: () => {
          setLiked(false);
          setLikesCount((count) => count - 1);
        },
      });
    } else {
      removeLikeComment.mutate(comment.id, {
        onError: () => {
          setLiked(true);
          setLikesCount((count) => count + 1);
        },
      });
    }
  };

  const showLike = !comment.isBlocked && !comment.isRemoved;
  const showReplyAction = !isReply && !comment.isBlocked && !comment.isRemoved;
  const showViewReplies = !isReply && (repliesCount > 0 || repliesExpanded);

  return (
    <View
      className={isReply ? "flex-row items-start gap-2 py-1" : "flex-row items-start gap-2.5 py-1.5"}
    >
      <UserAvatar
        user={comment.isBlocked ? null : user}
        size={avatarSize}
        iconColor={theme.iconMuted}
      />

      <View className="min-w-0 flex-1">
        <Text className={isReply ? "text-xs" : "text-sm"}>
          {comment.isBlocked ? (
            <Text className="italic" style={{ color: theme.tabIconColour }}>
              {comment.text}
            </Text>
          ) : (
            <>
              <Text className="font-semibold" style={{ color: theme.title }}>
                {displayName}
              </Text>{" "}
              {comment.isRemoved ? (
                <Text className="italic" style={{ color: theme.tabIconColour }}>
                  {comment.text}
                </Text>
              ) : (
                <Text style={{ color: theme.text }}>{comment.text}</Text>
              )}
            </>
          )}
        </Text>

        <View className="flex-row items-center gap-3 pt-1">
          <Text className="text-2xs" style={{ color: theme.tabIconColour }}>
            {formatDateDetailed(comment.createdAt)}
          </Text>
          {showReplyAction ? (
            <PressableScale onPress={() => setReplyBoxOpen((open) => !open)}>
              <Text className="text-2xs font-medium" style={{ color: theme.tabIconColour }}>
                Reply
              </Text>
            </PressableScale>
          ) : null}
          {showViewReplies ? (
            <PressableScale onPress={() => setRepliesExpanded((open) => !open)}>
              <Text className="text-2xs font-medium" style={{ color: theme.tabIconColour }}>
                {repliesExpanded ? "Hide replies" : `View replies (${repliesCount})`}
              </Text>
            </PressableScale>
          ) : null}
        </View>

        {!isReply && replyBoxOpen ? (
          <ReplyInput
            postId={postId}
            parentId={comment.id}
            onSent={() => {
              setRepliesCount((count) => count + 1);
              setRepliesExpanded(true);
              setReplyBoxOpen(false);
            }}
          />
        ) : null}

        {!isReply && repliesExpanded ? (
          <CommentReplies postId={postId} parentId={comment.id} />
        ) : null}
      </View>

      {showLike ? (
        <View className="pt-0.5">
          <CommentLikeButton
            liked={liked}
            likesCount={likesCount}
            onPress={handleToggleLike}
            color={Colors.like}
            mutedColor={theme.iconMuted}
            size={heartSize}
          />
        </View>
      ) : null}
    </View>
  );
};

export default Comment;
