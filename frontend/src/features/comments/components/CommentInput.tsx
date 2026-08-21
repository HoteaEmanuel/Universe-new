import { type KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { SendHorizonal, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import EmojiPickerPopover from "@/features/chat/components/EmojiPickerPopover";
import { useSendCommentMutation } from "@/queryAndMutation/mutations/comment-mutation";
import { insertEmojiAtSelection } from "@/utils/insertEmojiAtSelection";
import MentionAutocomplete from "@/components/MentionAutocomplete";
import { useMentionAutocomplete } from "@/hooks/useMentionAutocomplete";
import { insertMentionAtCursor } from "@/utils/insertMentionAtCursor";
import { useAutosizeTextarea } from "@/hooks/useAutosizeTextarea";

type CommentFormValues = {
  comment: string;
};

const CommentInput = () => {
  const {
    handleSubmit,
    register,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CommentFormValues>();
  const { id: postId } = useParams();
  const { mutate: sendCommentMutation, isPending } =
    useSendCommentMutation(postId);
  const commentValue = watch("comment");
  const commentInputRef = useAutosizeTextarea(commentValue ?? "");
  const mentionAutocomplete = useMentionAutocomplete({
    inputRef: commentInputRef,
    value: commentValue ?? "",
  });
  const { ref: commentFieldRef, ...commentField } = register("comment", {
    required: true,
    validate: (comment) => comment.trim() !== "",
  });

  const onSubmit = (data: CommentFormValues) => {
    sendCommentMutation(data.comment);
    reset();
  };

  const handleEmojiPick = (emoji: string) => {
    insertEmojiAtSelection({
      input: commentInputRef.current,
      value: getValues("comment") ?? "",
      emoji,
      onChange: (comment) => {
        setValue("comment", comment, { shouldValidate: true, shouldDirty: true });
      },
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className="border-t border-border px-4 py-2.5">
      {errors?.comment?.message && (
        <p className="pb-1 text-xs text-destructive">
          {errors.comment.message}
        </p>
      )}
      <form
        className="flex items-center gap-2"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="relative flex-1">
          <Textarea
            rows={1}
            className="min-h-9 max-h-24 w-full resize-none overflow-y-hidden rounded-2xl border-none bg-muted px-3.5 py-2 leading-5 focus-visible:ring-1"
            {...commentField}
            ref={(input: HTMLTextAreaElement | null) => {
              commentFieldRef(input);
              commentInputRef.current = input;
            }}
            onKeyUp={mentionAutocomplete.refresh}
            onClick={mentionAutocomplete.refresh}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment..."
            autoComplete="off"
          />
          {mentionAutocomplete.isOpen && (
            <MentionAutocomplete
              users={mentionAutocomplete.users}
              isLoading={mentionAutocomplete.isLoading}
              placement="above"
              onSelect={(user) => insertMentionAtCursor({
                input: commentInputRef.current,
                value: getValues("comment") ?? "",
                username: user.username,
                onChange: (comment) => setValue("comment", comment, { shouldValidate: true, shouldDirty: true }),
              })}
            />
          )}
        </div>
        <EmojiPickerPopover
          onPick={handleEmojiPick}
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Add emoji"
            >
              <Smile className="size-4" />
            </Button>
          }
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon-sm"
          disabled={!commentValue?.trim() || isPending}
          aria-label="Post comment"
        >
          <SendHorizonal className="size-4 text-primary" />
        </Button>
      </form>
    </div>
  );
};

export default CommentInput;
