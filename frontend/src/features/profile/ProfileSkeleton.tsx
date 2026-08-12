import { Skeleton } from "@/components/ui/skeleton";

const ProfileSkeleton = () => {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-8">
        <Skeleton className="size-24 shrink-0 rounded-full sm:size-28" />
        <div className="flex w-full flex-1 flex-col items-center gap-3 sm:items-start">
          <Skeleton className="h-6 w-40" />
          <div className="flex gap-5">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>

      <ul className="grid grid-cols-3 gap-1 sm:gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <li key={i}>
            <Skeleton className="aspect-square rounded-lg" />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProfileSkeleton;
