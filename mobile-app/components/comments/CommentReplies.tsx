import { View, Text, ActivityIndicator } from "react-native";
import { useGetCommentRepliesInfinite } from "@queryAndMutation/queries/comments-queries";
import { Colors } from "@constants/colors";
import { PressableScale } from "@lib/styled";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import Comment from "./Comment";

type CommentRepliesProps = {
  postId: string;
  parentId: string;
};

// A reply thread expands in place inside its parent comment's row in the
// outer comments FlatList — it never scrolls on its own. Nesting a second
// FlatList here (even with scrollEnabled={false}) would stop receiving scroll
// events, freezing its virtualization window and onEndReached permanently
// after the first render — so pagination is a manual tap instead, the only
// mechanism that's actually correct at this nesting depth.
const CommentReplies = ({ postId, parentId }: CommentRepliesProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const { data, isPending, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetCommentRepliesInfinite(postId, parentId);

  const replies = data?.pages.flatMap((page) => page.comments) ?? [];

  return (
    <View className="mt-1.5 gap-1 border-l pl-3" style={{ borderColor: theme.borderColor }}>
      {isPending ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        replies.map((reply) => <Comment key={reply.id} comment={reply} postId={postId} />)
      )}

      {isFetchingNextPage ? <ActivityIndicator size="small" color={Colors.primary} /> : null}

      {!isPending && hasNextPage && !isFetchingNextPage ? (
        <PressableScale onPress={() => fetchNextPage()} className="py-1">
          <Text className="text-2xs font-medium" style={{ color: theme.tabIconColour }}>
            View more replies
          </Text>
        </PressableScale>
      ) : null}
    </View>
  );
};

export default CommentReplies;
