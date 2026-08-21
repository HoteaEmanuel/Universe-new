import { useRef } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { SendHorizonal, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EmojiPickerPopover from "@/features/chat/components/EmojiPickerPopover";
import { useSendCommentMutation } from "@/queryAndMutation/mutations/comment-mutation";
import { insertEmojiAtSelection } from "@/utils/insertEmojiAtSelection";

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
  const commentInputRef = useRef<HTMLInputElement>(null);
  const { id: postId } = useParams();
  const { mutate: sendCommentMutation, isPending } =
    useSendCommentMutation(postId);
  const commentValue = watch("comment");
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
        <Input
          type="text"
          className="h-9 flex-1 rounded-full border-none bg-muted px-3.5 focus-visible:ring-1"
          {...commentField}
          ref={(input: HTMLInputElement | null) => {
            commentFieldRef(input);
            commentInputRef.current = input;
          }}
          placeholder="Add a comment..."
          autoComplete="off"
        />
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
