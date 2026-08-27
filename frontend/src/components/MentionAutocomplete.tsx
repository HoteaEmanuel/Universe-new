import type { MouseEvent } from "react";
import type { MentionUser } from "@/queryAndMutation/types";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";

const MentionAutocomplete = ({
  users,
  isLoading,
  onSelect,
  placement = "below",
}: {
  users: MentionUser[];
  isLoading: boolean;
  onSelect: (user: MentionUser) => void;
  placement?: "above" | "below";
}) => (
  <ul
    className={`absolute z-50 w-full overflow-hidden rounded-lg border border-input bg-popover shadow-md ${
      placement === "above" ? "bottom-full mb-1" : "top-full mt-1"
    }`}
  >
    {isLoading && <li className="px-3 py-2 text-sm text-muted-foreground">Searching…</li>}
    {!isLoading && users.map((user) => (
      <li key={user.id}>
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full justify-start gap-2 px-3 py-2 text-left text-sm"
          onMouseDown={(event: MouseEvent) => { event.preventDefault(); onSelect(user); }}
        >
          <UserAvatar user={user} className="size-6" />
          <span className="font-medium">@{user.username}</span>
          <span className="truncate text-muted-foreground">{user.firstName || user.name || user.lastName}</span>
        </Button>
      </li>
    ))}
  </ul>
);

export default MentionAutocomplete;
