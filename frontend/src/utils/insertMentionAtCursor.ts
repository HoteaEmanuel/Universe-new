export const insertMentionAtCursor = ({
  input,
  value,
  username,
  onChange,
}: {
  input: HTMLInputElement | HTMLTextAreaElement | null;
  value: string;
  username: string;
  onChange: (nextValue: string) => void;
}) => {
  const caret = input?.selectionStart ?? value.length;
  const beforeCaret = value.slice(0, caret);
  const match = beforeCaret.match(/@([a-z0-9_]*)$/i);
  if (!match) return;

  const start = caret - match[0].length;
  const mention = `@${username} `;
  const nextValue = `${value.slice(0, start)}${mention}${value.slice(caret)}`;
  onChange(nextValue);

  requestAnimationFrame(() => {
    input?.focus();
    const nextCaret = start + mention.length;
    input?.setSelectionRange(nextCaret, nextCaret);
  });
};
