import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStartConversationMutation } from "../../../queryAndMutation/mutations/conversation-mutation";

type NewConversationPanelProps = {
  targetUserId: string;
};

const NewConversationPanel = ({ targetUserId }: NewConversationPanelProps) => {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const { mutate, isPending } = useStartConversationMutation();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const message = text.trim();
    if (!message) return;
    mutate(
      { userId: targetUserId, message },
      {
        onSuccess: (conversationId: string) => {
          navigate(`/conversations/${conversationId}`);
        },
        onError: (error: unknown) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Could not start conversation",
          );
        },
      },
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          No messages yet. Say hi!
        </p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-border px-3 py-2"
      >
        <Input
          type="text"
          value={text}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
          placeholder="Send a message"
          className="flex-1"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!text.trim() || isPending}
          aria-label="Send message"
        >
          <SendHorizontal />
        </Button>
      </form>
    </div>
  );
};

export default NewConversationPanel;
