import { useState } from "react";
import { Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={joined || isPending}
        onClick={() => joinGroup(user.id, { onSuccess: () => setJoined(true) })}
        className="pill-follow shrink-0 gap-1 px-3"
      >
        {joined ? (
          <>
            <Check className="size-3.5" /> Joined
          </>
        ) : (
          "Join"
        )}
      </Button>
    </li>
  );
};

export default GroupSuggestionCard;
