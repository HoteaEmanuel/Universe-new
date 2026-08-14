import { useGetUsersWhoLikedPostQuery } from "@/queryAndMutation/queries/post-queries";
import UserListElement from "@/components/UserListElement";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

type LikesModalProps = {
  open: boolean;
  onClose: () => void;
  postId: string;
};

const LikesModal = ({ open, onClose, postId }: LikesModalProps) => {
  const { data, error, isLoading } = useGetUsersWhoLikedPostQuery(postId);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Sheet open={open} onOpenChange={(next: boolean) => !next && onClose()}>
        <SheetContent
          side="bottom"
          className="mx-auto flex max-h-[70vh] w-full flex-col rounded-t-2xl sm:max-w-md"
        >
          <SheetHeader className="border-b border-border pb-3">
            <SheetTitle>Likes</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {isLoading && (
              <ul className="flex flex-col gap-3 pt-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="size-12 shrink-0 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </li>
                ))}
              </ul>
            )}
            {!!error && (
              <p className="pt-8 text-center text-sm text-muted-foreground">
                Couldn&apos;t load likes.
              </p>
            )}
            {!isLoading && !error && data?.length === 0 && (
              <p className="pt-8 text-center text-sm text-muted-foreground">
                No likes yet.
              </p>
            )}
            {!isLoading && !error && data && data.length > 0 && (
              <ul className="flex flex-col gap-1 pt-1">
                {data.map((user) => (
                  <li key={user.id}>
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

export default LikesModal;
