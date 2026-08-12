import UserListElement from "../components/UserListElement";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import type { ProfileUser } from "../features/profile/types";

type FollowListSheetProps = {
  open: boolean;
  onClose: () => void;
  title: "Followers" | "Following";
  users?: ProfileUser[];
  isLoading?: boolean;
};

const FollowListSheet = ({
  open,
  onClose,
  title,
  users,
  isLoading,
}: FollowListSheetProps) => {
  const emptyMessage =
    title === "Followers" ? "No followers yet." : "Not following anyone yet.";

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Sheet open={open} onOpenChange={(next: boolean) => !next && onClose()}>
        <SheetContent
          side="bottom"
          className="mx-auto flex max-h-[70vh] w-full flex-col rounded-t-2xl sm:max-w-md"
        >
          <SheetHeader className="border-b border-border pb-3">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {isLoading && (
              <ul className="flex flex-col gap-3 pt-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className="flex items-center gap-3 p-2">
                    <div className="size-12 shrink-0 animate-pulse rounded-full bg-muted" />
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  </li>
                ))}
              </ul>
            )}
            {!isLoading && (!users || users.length === 0) && (
              <p className="pt-8 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </p>
            )}
            {!isLoading && users && users.length > 0 && (
              <ul className="flex flex-col gap-1 pt-1">
                {users.map((user) => (
                  <li key={user._id}>
                    <UserListElement user={user} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default FollowListSheet;
