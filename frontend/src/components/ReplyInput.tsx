import { useForm } from "react-hook-form";
import { SendHorizonal } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useSendReplyMutation } from "../queryAndMutation/mutations/comment-mutation";

type ReplyFormValues = {
  reply: string;
};

type ReplyInputProps = {
  postId?: string;
  parentId: string;
  onSent: () => void;
};

const ReplyInput = ({ postId, parentId, onSent }: ReplyInputProps) => {
  const {
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<ReplyFormValues>();
  const { mutate: sendReplyMutation, isPending } = useSendReplyMutation(
    postId,
    parentId,
  );
  const replyValue = watch("reply");

  const onSubmit = (data: ReplyFormValues) => {
    sendReplyMutation(data.reply, { onSuccess: onSent });
    reset();
  };

  return (
    <form
      className="mt-1.5 flex items-center gap-2"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Input
        type="text"
        className="h-7 flex-1 rounded-full border-none bg-muted px-3 text-xs focus-visible:ring-1"
        {...register("reply", {
          required: true,
          validate: (reply) => reply.trim() !== "",
        })}
        placeholder="Write a reply..."
        autoComplete="off"
        autoFocus
      />
      <Button
        type="submit"
        variant="ghost"
        size="icon-sm"
        disabled={!replyValue?.trim() || isPending}
        aria-label="Post reply"
      >
        <SendHorizonal className="size-3.5 text-primary" />
      </Button>
    </form>
  );
};

export default ReplyInput;
