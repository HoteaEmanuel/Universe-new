import type { ChangeEvent } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MAX_OPTIONS = 6;
const MIN_OPTIONS = 2;

type PollComposeFieldsProps = {
  question: string;
  onQuestionChange: (value: string) => void;
  options: string[];
  onOptionsChange: (options: string[]) => void;
};

const PollComposeFields = ({
  question,
  onQuestionChange,
  options,
  onOptionsChange,
}: PollComposeFieldsProps) => {
  const updateOption = (index: number, value: string) => {
    onOptionsChange(options.map((option, i) => (i === index ? value : option)));
  };

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    onOptionsChange([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= MIN_OPTIONS) return;
    onOptionsChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
      <Input
        type="text"
        placeholder="Ask a question"
        value={question}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onQuestionChange(e.target.value)
        }
        maxLength={200}
      />
      <div className="flex flex-col gap-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              type="text"
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                updateOption(index, e.target.value)
              }
              maxLength={80}
            />
            {options.length > MIN_OPTIONS && (
              <button
                type="button"
                onClick={() => removeOption(index)}
                aria-label={`Remove option ${index + 1}`}
                className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-destructive"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      {options.length < MAX_OPTIONS && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit"
          onClick={addOption}
        >
          <Plus className="size-4" /> Add option
        </Button>
      )}
    </div>
  );
};

export default PollComposeFields;
