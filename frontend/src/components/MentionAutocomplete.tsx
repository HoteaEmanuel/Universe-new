import type { MentionUser } from "@/queryAndMutation/types";

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
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
          onMouseDown={(event) => { event.preventDefault(); onSelect(user); }}
        >
          {user.profilePicture && <img src={user.profilePicture} alt="" className="size-6 rounded-full object-cover" />}
          <span className="font-medium">@{user.username}</span>
          <span className="truncate text-muted-foreground">{user.firstName || user.name || user.lastName}</span>
        </button>
      </li>
    ))}
  </ul>
);

export default MentionAutocomplete;
