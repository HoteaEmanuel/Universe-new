import { Fragment } from "react";
import { Link } from "react-router-dom";
import type { MentionUser } from "@/queryAndMutation/types";

const MENTION_TOKEN = /@([a-z0-9_]{3,30})\b/gi;

const MentionText = ({
  text,
  mentionedUsers,
  variant = "default",
}: {
  text?: string | null;
  mentionedUsers: MentionUser[];
  variant?: "default" | "on-accent";
}) => {
  const byUsername = new Map(
    mentionedUsers.map((user) => [user.username.toLowerCase(), user]),
  );
  const parts = (text ?? "").split(MENTION_TOKEN);

  return (
    <>
      {parts.map((part, index) => {
        if (index % 2 === 0) return <Fragment key={index}>{part}</Fragment>;
        const user = byUsername.get(part.toLowerCase());
        return user ? (
          <Link
            key={index}
            to={`/u/${user.username}`}
            className={
              variant === "on-accent"
                ? "font-semibold text-primary-foreground underline decoration-primary-foreground/60 underline-offset-2 hover:text-primary-foreground/85"
                : "font-medium text-primary hover:underline"
            }
          >
            @{part}
          </Link>
        ) : (
          <Fragment key={index}>@{part}</Fragment>
        );
      })}
    </>
  );
};

export default MentionText;
