import type { TypingUser } from "../hooks/useTypingIndicator";

type TypingIndicatorProps = {
  typingUsers: TypingUser[];
  variant: "direct" | "group";
};

const formatNames = (names: string[]) => {
  if (names.length <= 2) return names.join(" and ");
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
};

const TypingIndicator = ({ typingUsers, variant }: TypingIndicatorProps) => {
  if (typingUsers.length === 0) return null;

  const label =
    variant === "group"
      ? `${formatNames(typingUsers.map((u) => u.name))} ${
          typingUsers.length > 1 ? "are" : "is"
        } typing`
      : "Typing";

  return (
    <div className="flex items-center gap-2 px-4 pb-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-1 rounded-2xl bg-muted px-3 py-2">
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
      </span>
      <span>{label}</span>
    </div>
  );
};

export default TypingIndicator;
