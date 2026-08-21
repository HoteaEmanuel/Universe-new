import { useRef } from "react";
import { useForm } from "react-hook-form";
import { SendHorizonal, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EmojiPickerPopover from "@/features/chat/components/EmojiPickerPopover";
import { useSendReplyMutation } from "@/queryAndMutation/mutations/comment-mutation";
import { insertEmojiAtSelection } from "@/utils/insertEmojiAtSelection";

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
    getValues,
    setValue,
    watch,
  } = useForm<ReplyFormValues>();
  const replyInputRef = useRef<HTMLInputElement>(null);
  const { mutate: sendReplyMutation, isPending } = useSendReplyMutation(
    postId,
    parentId,
  );
  const replyValue = watch("reply");
  const { ref: replyFieldRef, ...replyField } = register("reply", {
    required: true,
    validate: (reply) => reply.trim() !== "",
  });

  const onSubmit = (data: ReplyFormValues) => {
    sendReplyMutation(data.reply, { onSuccess: onSent });
    reset();
  };

  const handleEmojiPick = (emoji: string) => {
    insertEmojiAtSelection({
      input: replyInputRef.current,
      value: getValues("reply") ?? "",
      emoji,
      onChange: (reply) => {
        setValue("reply", reply, { shouldValidate: true, shouldDirty: true });
      },
    });
  };

  return (
    <form
      className="mt-1.5 flex items-center gap-2"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Input
        type="text"
        className="h-7 flex-1 rounded-full border-none bg-muted px-3 text-xs focus-visible:ring-1"
        {...replyField}
        ref={(input: HTMLInputElement | null) => {
          replyFieldRef(input);
          replyInputRef.current = input;
        }}
        placeholder="Write a reply..."
        autoComplete="off"
        autoFocus
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
            <Smile className="size-3.5" />
          </Button>
        }
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
