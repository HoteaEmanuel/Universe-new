import { useState } from "react";
import { Users, Check } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useAddMemberToGroupMutation } from "@/queryAndMutation/mutations/group-mutation";
import type { GroupConversation } from "@/features/chat/types";

const GroupSuggestionCard = ({ group }: { group: GroupConversation }) => {
  const { user } = useAuthStore() as { user: { id: string } };
  const [joined, setJoined] = useState(false);
  const { mutate: joinGroup, isPending } = useAddMemberToGroupMutation(group.id);

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl p-2 hover:bg-muted">
      <div className="flex min-w-0 items-center gap-3">
        {group.coverImageUrl ? (
          <img
            src={group.coverImageUrl}
            alt=""
            className="size-12 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted">
            <Users className="size-5 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-medium">{group.name}</p>
          {group.description && (
            <p className="truncate text-xs text-muted-foreground">
              {group.description}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        disabled={joined || isPending}
        onClick={() => joinGroup(user.id, { onSuccess: () => setJoined(true) })}
        className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-primary transition-transform duration-200 ease-in hover:scale-105 disabled:opacity-50"
      >
        {joined ? (
          <>
            <Check className="size-3.5" /> Joined
          </>
        ) : (
          "Join"
        )}
      </button>
    </li>
  );
};

export default GroupSuggestionCard;
