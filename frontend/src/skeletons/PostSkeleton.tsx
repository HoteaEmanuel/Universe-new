import { Skeleton } from "../components/ui/skeleton";

const PostSkeleton = () => {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-3 px-4 py-3">
        <Skeleton className="size-9 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-2 px-4 py-4">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
};

export default PostSkeleton;
