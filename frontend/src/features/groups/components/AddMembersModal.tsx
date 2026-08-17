import { useMemo, useState, type ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFullName } from "@/utils/fullName";
import { useDebounce } from "@/hooks/Debounce";
import { useAuthStore } from "@/store/authStore";
import { useAddMemberToGroupMutation } from "@/queryAndMutation/mutations/group-mutation";
import {
  useGetGroupMembers,
  useGetUsersFromSameUniversityNotInGroupQuery,
} from "@/queryAndMutation/queries/group-queries";
import { useGetConvoUsers } from "@/queryAndMutation/queries/conversation-queries";
import {
  useGetAllUsersQuery,
  useGetFollowersQuery,
  useGetFollowingQuery,
} from "@/queryAndMutation/queries/user-queries";
import type { ChatUser, GroupMember } from "@/features/chat/types";

type AddMembersModalProps = {
  open: boolean;
  onClose: () => void;
};

type MemberCandidateRowProps = {
  candidate: ChatUser;
  groupMembers?: GroupMember[];
  onAdd: (userId: string) => void;
  isAdding: boolean;
};

const MemberCandidateRow = ({
  candidate,
  groupMembers,
  onAdd,
  isAdding,
}: MemberCandidateRowProps) => {
  const alreadyMember = groupMembers?.some(
    (member) => member.memberId === candidate.id,
  );

  return (
    <li className="flex items-center gap-3 p-2">
      {candidate.profilePicture ? (
        <img
          src={candidate.profilePicture}
          className="size-11 shrink-0 rounded-full object-cover"
        />
      ) : (
        <FaUserCircle className="size-11 shrink-0 text-muted-foreground" />
      )}
      <p className="min-w-0 flex-1 truncate font-medium">
        {getFullName(candidate)}
      </p>
      {alreadyMember ? (
        <span className="shrink-0 text-xs text-muted-foreground">Added</span>
      ) : (
        <Button
          size="sm"
          disabled={isAdding}
          onClick={() => onAdd(candidate.id)}
        >
          Add
        </Button>
      )}
    </li>
  );
};

const AddMembersModal = ({ open, onClose }: AddMembersModalProps) => {
  const { id: groupId } = useParams();
  const { user } = useAuthStore() as { user: ChatUser };
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data: allUsers } = useGetAllUsersQuery();
  const { data: convoUsers } = useGetConvoUsers();
  const { data: groupMembers, isPending: isPendingGroupMembers } =
    useGetGroupMembers(groupId);
  const { data: followers } = useGetFollowersQuery(user.id);
  const { data: following } = useGetFollowingQuery(user.id);
  const { data: usersFromSameUniversity } =
    useGetUsersFromSameUniversityNotInGroupQuery(groupId);
  const { mutate: addMember, isPending: isAdding } =
    useAddMemberToGroupMutation(groupId);

  const searchResults = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (query.length < 2 || !allUsers) return [];
    return allUsers.filter((candidate: ChatUser) =>
      getFullName(candidate).toLowerCase().includes(query),
    );
  }, [allUsers, debouncedSearch]);

  const sections: { title: string; users?: ChatUser[] }[] = [
    { title: "From your conversations", users: convoUsers },
    { title: "From your university", users: usersFromSameUniversity },
    { title: "Search results", users: searchResults },
    { title: "Your followers", users: followers },
    { title: "People you follow", users: following },
  ];

  return (
    <Sheet open={open} onOpenChange={(next: boolean) => !next && onClose()}>
      <SheetContent
        side="bottom"
        className="mx-auto flex max-h-[80vh] w-full flex-col rounded-t-2xl sm:max-w-md"
      >
        <SheetHeader className="border-b border-border pb-3">
          <SheetTitle>Add members</SheetTitle>
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
          {isPendingGroupMembers && (
            <p className="pt-4 text-center text-sm text-muted-foreground">
              Loading...
            </p>
          )}
          {!isPendingGroupMembers &&
            sections.map(
              ({ title, users }) =>
                users &&
                users.length > 0 && (
                  <div key={title}>
                    <p className="px-1 pb-1 text-xs font-medium text-muted-foreground">
                      {title}
                    </p>
                    <ul className="flex flex-col gap-1">
                      {users.map((candidate) => (
                        <MemberCandidateRow
                          key={candidate.id}
                          candidate={candidate}
                          groupMembers={groupMembers}
                          onAdd={addMember}
                          isAdding={isAdding}
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

export default AddMembersModal;
