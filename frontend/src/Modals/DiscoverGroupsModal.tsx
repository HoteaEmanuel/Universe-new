import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { useAuthStore } from "../store/authStore";
import { useGetDiscoverablePublicGroups } from "../queryAndMutation/queries/group-queries";
import { useAddMemberToGroupMutation } from "../queryAndMutation/mutations/group-mutation";
import type { GroupConversation } from "../features/chat/types";

type DiscoverGroupsModalProps = {
  open: boolean;
  onClose: () => void;
};

type DiscoverGroupRowProps = {
  group: GroupConversation;
  onJoined: (groupId: string) => void;
};

const DiscoverGroupRow = ({ group, onJoined }: DiscoverGroupRowProps) => {
  const { mutate: joinGroup, isPending } = useAddMemberToGroupMutation(group.id);
  const { user } = useAuthStore() as { user: { id: string } };

  return (
    <li className="flex items-center justify-between gap-3 p-2">
      <div className="flex min-w-0 items-center gap-3">
        {group.coverImageUrl ? (
          <img
            src={group.coverImageUrl}
            alt={group.name}
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
        size="sm"
        disabled={isPending}
        onClick={() =>
          joinGroup(user.id, { onSuccess: () => onJoined(group.id) })
        }
      >
        Join
      </Button>
    </li>
  );
};

const DiscoverGroupsModal = ({ open, onClose }: DiscoverGroupsModalProps) => {
  const navigate = useNavigate();
  const { data: groups, isPending } = useGetDiscoverablePublicGroups(open);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Sheet open={open} onOpenChange={(next: boolean) => !next && onClose()}>
        <SheetContent
          side="bottom"
          className="mx-auto flex max-h-[70vh] w-full flex-col rounded-t-2xl sm:max-w-md"
        >
          <SheetHeader className="border-b border-border pb-3">
            <SheetTitle>Discover public groups</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {isPending && (
              <ul className="flex flex-col gap-3 pt-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <li key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="size-12 shrink-0 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </li>
                ))}
              </ul>
            )}
            {!isPending && (!groups || groups.length === 0) && (
              <p className="pt-8 text-center text-sm text-muted-foreground">
                No public groups to join right now.
              </p>
            )}
            {!isPending && groups && groups.length > 0 && (
              <ul className="flex flex-col gap-1 pt-1">
                {groups.map((group) => (
                  <DiscoverGroupRow
                    key={group.id}
                    group={group}
                    onJoined={(groupId) => {
                      onClose();
                      navigate(`/groups/${groupId}`);
                    }}
                  />
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DiscoverGroupsModal;
