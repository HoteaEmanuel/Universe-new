import { Skeleton } from "@/components/ui/skeleton";

type UserListSkeletonProps = {
  count?: number;
  lines?: 1 | 2;
};

const UserListSkeleton = ({ count = 4, lines = 1 }: UserListSkeletonProps) => (
  <ul className="flex flex-col gap-3 pt-1">
    {Array.from({ length: count }).map((_, i) => (
      <li key={i} className="flex items-center gap-3 p-2">
        <Skeleton className="size-12 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          {lines === 2 && <Skeleton className="h-3 w-20" />}
        </div>
      </li>
    ))}
  </ul>
);

export default UserListSkeleton;
