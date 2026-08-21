import { type KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
import { SendHorizonal, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import EmojiPickerPopover from "@/features/chat/components/EmojiPickerPopover";
import { useSendReplyMutation } from "@/queryAndMutation/mutations/comment-mutation";
import { insertEmojiAtSelection } from "@/utils/insertEmojiAtSelection";
import MentionAutocomplete from "@/components/MentionAutocomplete";
import { useMentionAutocomplete } from "@/hooks/useMentionAutocomplete";
import { insertMentionAtCursor } from "@/utils/insertMentionAtCursor";
import { useAutosizeTextarea } from "@/hooks/useAutosizeTextarea";

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
  const { mutate: sendReplyMutation, isPending } = useSendReplyMutation(
    postId,
    parentId,
  );
  const replyValue = watch("reply");
  const replyInputRef = useAutosizeTextarea(replyValue ?? "");
  const mentionAutocomplete = useMentionAutocomplete({
    inputRef: replyInputRef,
    value: replyValue ?? "",
  });
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

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <form
      className="mt-1.5 flex items-center gap-2"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="relative flex-1">
        <Textarea
          rows={1}
          className="min-h-7 max-h-24 w-full resize-none overflow-y-hidden rounded-xl border-none bg-muted px-3 py-1 text-xs leading-4 focus-visible:ring-1"
          {...replyField}
          ref={(input: HTMLTextAreaElement | null) => {
            replyFieldRef(input);
            replyInputRef.current = input;
          }}
          onKeyUp={mentionAutocomplete.refresh}
          onClick={mentionAutocomplete.refresh}
          onKeyDown={handleKeyDown}
          placeholder="Write a reply..."
          autoComplete="off"
          autoFocus
        />
        {mentionAutocomplete.isOpen && (
          <MentionAutocomplete
            users={mentionAutocomplete.users}
            isLoading={mentionAutocomplete.isLoading}
            onSelect={(user) => insertMentionAtCursor({
              input: replyInputRef.current,
              value: getValues("reply") ?? "",
              username: user.username,
              onChange: (reply) => setValue("reply", reply, { shouldValidate: true, shouldDirty: true }),
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
