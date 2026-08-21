import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  BarChart3,
  ImagePlus,
  Mic,
  Paperclip,
  SendHorizontal,
  Smile,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useSendFilesMessageMutation,
  useSendMessageMutation,
  useSendVoiceMessageMutation,
} from "../../../queryAndMutation/mutations/conversation-mutation";
import {
  useSendFilesMessageToGroupMutation,
  useSendMessageToGroupMutation,
  useSendPollMessageToGroupMutation,
  useSendVoiceMessageToGroupMutation,
} from "../../../queryAndMutation/mutations/group-mutation";
import { useAuthStore } from "../../../store/authStore";
import { getFullName } from "../../../utils/fullName";
import { insertEmojiAtSelection } from "../../../utils/insertEmojiAtSelection";
import { formatFileSize } from "../utils/formatFileSize";
import { getFileTypeIcon } from "../utils/fileTypeIcon";
import ImagePickerModal from "./ImagePickerModal";
import FilePickerModal from "./FilePickerModal";
import CreatePollModal from "./CreatePollModal";
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
  const [files, setFiles] = useState<File[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [filePickerOpen, setFilePickerOpen] = useState(false);
  const [pollModalOpen, setPollModalOpen] = useState(false);
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
  const directFilesMutation = useSendFilesMessageMutation(
    variant === "direct" ? id : undefined,
  );
  const groupFilesMutation = useSendFilesMessageToGroupMutation(
    variant === "group" ? id : undefined,
  );
  const { mutate: mutateFiles, isPending: isSendingFiles } =
    variant === "direct" ? directFilesMutation : groupFilesMutation;
  const directVoiceMutation = useSendVoiceMessageMutation(
    variant === "direct" ? id : undefined,
  );
  const groupVoiceMutation = useSendVoiceMessageToGroupMutation(
    variant === "group" ? id : undefined,
  );
  const { mutate: mutateVoice, isPending: isSendingVoice } =
    variant === "direct" ? directVoiceMutation : groupVoiceMutation;
  const { mutate: mutatePoll, isPending: isSendingPoll } =
    useSendPollMessageToGroupMutation(variant === "group" ? id : undefined);

  const canSend =
    (text.trim().length > 0 || images.length > 0 || files.length > 0) &&
    !isPending &&
    !isSendingFiles;

  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (lastTypingEmitRef.current) {
      socket.emit("stopTyping", { id });
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
      socket.emit("typing", { id, name: getFullName(user) });
      lastTypingEmitRef.current = now;
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  };

  const handleEmojiPick = (emoji: string) => {
    insertEmojiAtSelection({
      input: inputRef.current,
      value: text,
      emoji,
      onChange: setText,
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    stopTyping();
    const trimmedText = text.trim();
    const hasFiles = files.length > 0;

    if (images.length > 0 || !hasFiles) {
      mutate(
        { messageText: trimmedText, images },
        {
          onError: (error: unknown) => {
            toast.error(
              error instanceof Error ? error.message : "Could not send message",
            );
          },
        },
      );
    }
    if (hasFiles) {
      mutateFiles(
        { messageText: images.length > 0 ? "" : trimmedText, files },
        {
          onError: (error: unknown) => {
            toast.error(
              error instanceof Error ? error.message : "Could not send files",
            );
          },
        },
      );
    }
    setText("");
    setImages([]);
    setFiles([]);
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

  const handleSendPoll = (data: { question: string; options: string[] }) => {
    mutatePoll(data, {
      onError: (error: unknown) => {
        toast.error(
          error instanceof Error ? error.message : "Could not send poll",
        );
      },
    });
    setPollModalOpen(false);
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
      {files.length > 0 && (
        <ul className="flex flex-col gap-1 pb-2">
          {files.map((file, index) => {
            const Icon = getFileTypeIcon(file.type);
            return (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-2 py-1"
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFiles((prev) => prev.filter((_, i) => i !== index))
                  }
                  aria-label={`Remove ${file.name}`}
                  className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </li>
            );
          })}
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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Attach files"
          onClick={() => setFilePickerOpen(true)}
        >
          <Paperclip />
        </Button>
        {variant === "group" && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Create a poll"
            onClick={() => setPollModalOpen(true)}
          >
            <BarChart3 />
          </Button>
        )}
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
        {text.trim().length === 0 && images.length === 0 && files.length === 0 ? (
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
      <FilePickerModal
        open={filePickerOpen}
        onClose={() => setFilePickerOpen(false)}
        setFiles={setFiles}
      />
      {variant === "group" && (
        <CreatePollModal
          open={pollModalOpen}
          onClose={() => setPollModalOpen(false)}
          onSend={handleSendPoll}
          isSending={isSendingPoll}
        />
      )}
    </div>
  );
};

export default MessageInput;
