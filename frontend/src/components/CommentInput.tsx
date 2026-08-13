import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { SendHorizonal } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useSendCommentMutation } from "../queryAndMutation/mutations/comment-mutation";

type CommentFormValues = {
  comment: string;
};

const CommentInput = () => {
  const {
    handleSubmit,
    register,
    reset,
    watch,
    formState: { errors },
  } = useForm<CommentFormValues>();
  const { id: postId } = useParams();
  const { mutate: sendCommentMutation, isPending } =
    useSendCommentMutation(postId);
  const commentValue = watch("comment");

  const onSubmit = (data: CommentFormValues) => {
    sendCommentMutation(data.comment);
    reset();
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
          {...register("comment", {
            required: true,
            validate: (comment) => comment.trim() !== "",
          })}
          placeholder="Add a comment..."
          autoComplete="off"
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
