import { useState } from "react";
import { useParams } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { ShieldCheck } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getFullName } from "@/utils/fullName";
import { useAuthStore } from "@/store/authStore";
import {
  useCheckUserIsAdminQuery,
  useGetGroupMembers,
} from "@/queryAndMutation/queries/group-queries";
import { usePromoteMemberToAdminMutation } from "@/queryAndMutation/mutations/group-mutation";
import type { ChatUser } from "@/features/chat/types";
import BanGroupMemberDialog from "./BanGroupMemberDialog";
import BannedGroupMembersModal from "./BannedGroupMembersModal";

type ViewMembersModalProps = {
  open: boolean;
  onClose: () => void;
};

const ViewMembersModal = ({ open, onClose }: ViewMembersModalProps) => {
  const { id: groupId } = useParams();
  const { user } = useAuthStore() as { user: ChatUser };
  const { data: groupMembers, isPending } = useGetGroupMembers(groupId);
  const { data: isAdmin } = useCheckUserIsAdminQuery(groupId, user.id);
  const { mutate: promoteMemberToAdmin, isPending: isPromoting } =
    usePromoteMemberToAdminMutation(groupId);
  const [banTarget, setBanTarget] = useState<{ userId: string; name: string } | null>(
    null,
  );
  const [bannedListOpen, setBannedListOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={(next: boolean) => !next && onClose()}>
      <SheetContent
        side="bottom"
        className="mx-auto flex max-h-[70vh] w-full flex-col rounded-t-2xl sm:max-w-md"
      >
        <SheetHeader className="flex-row items-center justify-between border-b border-border pb-3">
          <SheetTitle>Group members</SheetTitle>
          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={() => setBannedListOpen(true)}>
              Banned users
            </Button>
          )}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {isPending && (
            <p className="pt-8 text-center text-sm text-muted-foreground">
              Loading...
            </p>
          )}
          {!isPending && (!groupMembers || groupMembers.length === 0) && (
            <p className="pt-8 text-center text-sm text-muted-foreground">
              No members found.
            </p>
          )}
          {!isPending && groupMembers && groupMembers.length > 0 && (
            <ul className="flex flex-col gap-1 pt-1">
              {groupMembers.map((member) => (
                <li key={member.id} className="flex items-center gap-3 p-2">
                  {member.member.profilePicture ? (
                    <img
                      src={member.member.profilePicture}
                      className="size-11 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <FaUserCircle className="size-11 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {getFullName(member.member)}
                    </p>
                    {member.role === "admin" && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ShieldCheck className="size-3" />
                        Admin
                      </p>
                    )}
                  </div>
                  {member.role === "member" && isAdmin && (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPromoting}
                        onClick={() => promoteMemberToAdmin(member.memberId)}
                      >
                        Make admin
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() =>
                          setBanTarget({
                            userId: member.memberId,
                            name: getFullName(member.member),
                          })
                        }
                      >
                        Ban
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
      <BanGroupMemberDialog
        open={!!banTarget}
        onClose={() => setBanTarget(null)}
        groupId={groupId}
        userId={banTarget?.userId}
        userName={banTarget?.name}
      />
      <BannedGroupMembersModal
        open={bannedListOpen}
        onClose={() => setBannedListOpen(false)}
      />
    </Sheet>
  );
};

export default ViewMembersModal;
