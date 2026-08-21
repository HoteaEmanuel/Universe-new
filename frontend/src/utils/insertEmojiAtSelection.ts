type InsertEmojiAtSelectionOptions = {
  input: HTMLInputElement | HTMLTextAreaElement | null;
  value: string;
  emoji: string;
  onChange: (value: string) => void;
};

export const insertEmojiAtSelection = ({
  input,
  value,
  emoji,
  onChange,
}: InsertEmojiAtSelectionOptions) => {
  const start = input?.selectionStart ?? value.length;
  const end = input?.selectionEnd ?? value.length;
  const next = value.slice(0, start) + emoji + value.slice(end);

  onChange(next);
  requestAnimationFrame(() => {
    const caret = start + emoji.length;
    input?.focus();
    input?.setSelectionRange(caret, caret);
  });
};
