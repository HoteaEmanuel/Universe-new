import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PollComposeFields from "@/features/polls/components/PollComposeFields";

type CreatePollModalProps = {
  open: boolean;
  onClose: () => void;
  onSend: (data: { question: string; options: string[] }) => void;
  isSending: boolean;
};

const CreatePollModal = ({
  open,
  onClose,
  onSend,
  isSending,
}: CreatePollModalProps) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const trimmedOptions = options.map((option) => option.trim()).filter(Boolean);
  const canSend = question.trim().length > 0 && trimmedOptions.length >= 2;

  const reset = () => {
    setQuestion("");
    setOptions(["", ""]);
  };

  const handleSend = () => {
    if (!canSend) return;
    onSend({ question: question.trim(), options: trimmedOptions });
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next: boolean) => {
        if (!next) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a poll</DialogTitle>
        </DialogHeader>
        <PollComposeFields
          question={question}
          onQuestionChange={setQuestion}
          options={options}
          onOptionsChange={setOptions}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!canSend || isSending}>
            Send poll
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePollModal;
