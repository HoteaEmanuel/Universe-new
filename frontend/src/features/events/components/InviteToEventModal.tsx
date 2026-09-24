import { useMemo, useState, type ChangeEvent } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UserAvatar from "@/components/UserAvatar";
import { getFullName } from "@/utils/fullName";
import { useDebounce } from "@/hooks/Debounce";
import { useAuthStore } from "@/store/authStore";
import {
  useGetAllUsersQuery,
  useGetFollowersQuery,
  useGetFollowingQuery,
} from "@/queryAndMutation/queries/user-queries";
import { useGetConvoUsers } from "@/queryAndMutation/queries/conversation-queries";
import { useInviteEventParticipantMutation } from "@/queryAndMutation/mutations/event-mutation";
import type { ChatUser } from "@/features/chat/types";

type InviteToEventModalProps = {
  open: boolean;
  onClose: () => void;
  eventId: string;
};

type InviteCandidateRowProps = {
  candidate: ChatUser;
  invited: boolean;
  onInvite: (userId: string) => void;
  isInviting: boolean;
};

const InviteCandidateRow = ({
  candidate,
  invited,
  onInvite,
  isInviting,
}: InviteCandidateRowProps) => (
  <li className="flex items-center gap-3 p-2">
    <UserAvatar user={candidate} />
    <p className="min-w-0 flex-1 truncate font-medium">
      {getFullName(candidate)}
    </p>
    {invited ? (
      <span className="shrink-0 text-xs text-muted-foreground">Invited</span>
    ) : (
      <Button
        size="sm"
        disabled={isInviting}
        onClick={() => onInvite(candidate.id)}
      >
        Invite
      </Button>
    )}
  </li>
);

const InviteToEventModal = ({
  open,
  onClose,
  eventId,
}: InviteToEventModalProps) => {
  const { user } = useAuthStore() as { user: ChatUser };
  const [searchTerm, setSearchTerm] = useState("");
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data: allUsers } = useGetAllUsersQuery();
  const { data: convoUsers } = useGetConvoUsers();
  const { data: followers } = useGetFollowersQuery(user.id);
  const { data: following } = useGetFollowingQuery(user.id);
  const { mutate: inviteParticipant, isPending: isInviting } =
    useInviteEventParticipantMutation(eventId);

  const searchResults = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (query.length < 2 || !allUsers) return [];
    return allUsers.filter((candidate: ChatUser) =>
      getFullName(candidate).toLowerCase().includes(query),
    );
  }, [allUsers, debouncedSearch]);

  const sections: { title: string; users?: ChatUser[] }[] = [
    { title: "From your conversations", users: convoUsers },
    { title: "Search results", users: searchResults },
    { title: "Your followers", users: followers },
    { title: "People you follow", users: following },
  ];

  const handleInvite = (userId: string) => {
    inviteParticipant(userId, {
      onSuccess: () => {
        setInvitedIds((prev) => new Set(prev).add(userId));
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={(next: boolean) => !next && onClose()}>
      <SheetContent
        side="bottom"
        className="mx-auto flex max-h-[80vh] w-full flex-col rounded-t-2xl sm:max-w-md"
      >
        <SheetHeader className="border-b border-border pb-3">
          <SheetTitle>Invite people</SheetTitle>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
          <Input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSearchTerm(e.target.value)
            }
          />
          {sections.map(
            ({ title, users }) =>
              users &&
              users.length > 0 && (
                <div key={title}>
                  <p className="px-1 pb-1 text-xs font-medium text-muted-foreground">
                    {title}
                  </p>
                  <ul className="flex flex-col gap-1">
                    {users.map((candidate) => (
                      <InviteCandidateRow
                        key={candidate.id}
                        candidate={candidate}
                        invited={invitedIds.has(candidate.id)}
                        onInvite={handleInvite}
                        isInviting={isInviting}
                      />
                    ))}
                  </ul>
                </div>
              ),
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default InviteToEventModal;
