import { useParams } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getFullName } from "@/utils/fullName";
import { useGetGroupBansInfinite } from "@/queryAndMutation/queries/group-queries";
import { useUnbanGroupMemberMutation } from "@/queryAndMutation/mutations/group-mutation";

type BannedGroupMembersModalProps = {
  open: boolean;
  onClose: () => void;
};

const SCROLL_THRESHOLD_PX = 150;

const BannedGroupMembersModal = ({ open, onClose }: BannedGroupMembersModalProps) => {
  const { id: groupId } = useParams();
  const { data, isPending, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetGroupBansInfinite(groupId, open);
  const { mutate: unbanMember, isPending: isUnbanning } =
    useUnbanGroupMemberMutation(groupId);

  const bans = data?.pages.flatMap((page) => page.items) ?? [];

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const distanceFromBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight;
    if (distanceFromBottom < SCROLL_THRESHOLD_PX && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <Sheet open={open} onOpenChange={(next: boolean) => !next && onClose()}>
      <SheetContent
        side="bottom"
        className="mx-auto flex max-h-[70vh] w-full flex-col rounded-t-2xl sm:max-w-md"
      >
        <SheetHeader className="border-b border-border pb-3">
          <SheetTitle>Banned users</SheetTitle>
        </SheetHeader>
        <div
          className="flex-1 overflow-y-auto px-4 pb-4"
          onScroll={handleScroll}
        >
          {isPending && (
            <p className="pt-8 text-center text-sm text-muted-foreground">
              Loading...
            </p>
          )}
          {!isPending && bans.length === 0 && (
            <p className="pt-8 text-center text-sm text-muted-foreground">
              No banned users.
            </p>
          )}
          {!isPending && bans.length > 0 && (
            <ul className="flex flex-col gap-1 pt-1">
              {bans.map((ban) => (
                <li key={ban.id} className="flex items-center gap-3 p-2">
                  {ban.user.profilePicture ? (
                    <img
                      src={ban.user.profilePicture}
                      className="size-11 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <FaUserCircle className="size-11 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{getFullName(ban.user)}</p>
                    {ban.reason && (
                      <p className="truncate text-xs text-muted-foreground">
                        {ban.reason}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isUnbanning}
                    onClick={() => unbanMember(ban.userId)}
                  >
                    Unban
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BannedGroupMembersModal;
