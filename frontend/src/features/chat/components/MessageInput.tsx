import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { ImagePlus, Mic, SendHorizontal, Smile, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useSendMessageMutation,
  useSendVoiceMessageMutation,
} from "../../../queryAndMutation/mutations/conversation-mutation";
import { useSendMessageToGroupMutation } from "../../../queryAndMutation/mutations/group-mutation";
import { useAuthStore } from "../../../store/authStore";
import { getFullName } from "../../../utils/fullName";
import ImagePickerModal from "./ImagePickerModal";
import EmojiPickerPopover from "./EmojiPickerPopover";
import VoiceRecorder from "./VoiceRecorder";
import type { ChatUser } from "../types";

type MessageInputProps = {
  variant: "direct" | "group";
  id: string;
};

const TYPING_IDLE_MS = 2000;
const TYPING_EMIT_THROTTLE_MS = 2000;

const MessageInput = ({ variant, id }: MessageInputProps) => {
  const [text, setText] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const { user, socket } = useAuthStore() as {
    user: ChatUser;
    socket: { emit: (event: string, payload: unknown) => void };
  };
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingEmitRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const directMutation = useSendMessageMutation(
    variant === "direct" ? id : undefined,
  );
  const groupMutation = useSendMessageToGroupMutation(
    variant === "group" ? id : undefined,
  );
  const { mutate, isPending } = variant === "direct" ? directMutation : groupMutation;
  const { mutate: mutateVoice, isPending: isSendingVoice } = useSendVoiceMessageMutation(
    variant === "direct" ? id : undefined,
  );

  const canSend = (text.trim().length > 0 || images.length > 0) && !isPending;

  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (lastTypingEmitRef.current) {
      socket.emit("stopTyping", { id, userId: user.id });
      lastTypingEmitRef.current = 0;
    }
  };

  useEffect(() => {
    return () => stopTyping();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    const now = Date.now();
    if (now - lastTypingEmitRef.current > TYPING_EMIT_THROTTLE_MS) {
      socket.emit("typing", { id, userId: user.id, name: getFullName(user) });
      lastTypingEmitRef.current = now;
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  };

  const handleEmojiPick = (emoji: string) => {
    const input = inputRef.current;
    const start = input?.selectionStart ?? text.length;
    const end = input?.selectionEnd ?? text.length;
    const next = text.slice(0, start) + emoji + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      const caret = start + emoji.length;
      input?.focus();
      input?.setSelectionRange(caret, caret);
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    stopTyping();
    mutate(
      { messageText: text.trim(), images },
      {
        onError: (error: unknown) => {
          toast.error(
            error instanceof Error ? error.message : "Could not send message",
          );
        },
      },
    );
    setText("");
    setImages([]);
  };

  const handleSendVoice = (audio: Blob, durationSec: number) => {
    mutateVoice(
      { audio, durationSec },
      {
        onError: (error: unknown) => {
          toast.error(
            error instanceof Error ? error.message : "Could not send voice message",
          );
        },
      },
    );
    setIsRecording(false);
  };

  if (isRecording) {
    return (
      <div className="border-t border-border bg-background px-3 py-2">
        <VoiceRecorder
          onCancel={() => setIsRecording(false)}
          onSend={handleSendVoice}
          isSending={isSendingVoice}
        />
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-background px-3 py-2">
      {images.length > 0 && (
        <ul className="flex flex-wrap gap-2 pb-2">
          {images.map((image, index) => (
            <li key={index} className="relative">
              <img
                src={URL.createObjectURL(image)}
                alt="attachment preview"
                className="size-14 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  setImages((prev) => prev.filter((_, i) => i !== index))
                }
                className="absolute -top-1.5 -right-1.5 rounded-full bg-background text-muted-foreground shadow ring-1 ring-border hover:text-destructive"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Attach images"
          onClick={() => setPickerOpen(true)}
        >
          <ImagePlus />
        </Button>
        <Input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleTextChange}
          onBlur={stopTyping}
          placeholder="Send a message"
          className="flex-1"
        />
        <EmojiPickerPopover
          onPick={handleEmojiPick}
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Add emoji"
            >
              <Smile />
            </Button>
          }
        />
        {variant === "direct" && text.trim().length === 0 && images.length === 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Record voice message"
            onClick={() => setIsRecording(true)}
          >
            <Mic />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={!canSend}
            aria-label="Send message"
          >
            <SendHorizontal />
          </Button>
        )}
      </form>
      <ImagePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        setImages={setImages}
      />
    </div>
  );
};

export default MessageInput;
