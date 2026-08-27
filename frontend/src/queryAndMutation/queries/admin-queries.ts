import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAdminStore, type AdminUsersPage } from "@/store/adminStore";

export const useGetAdminStatsQuery = () => {
  const { getStats } = useAdminStore();
  return useQuery({
    queryKey: ["adminStats"],
    queryFn: () => getStats(),
  });
};

export const useGetDailyActivityQuery = () => {
  const { getDailyActivity } = useAdminStore();
  return useQuery({
    queryKey: ["adminDailyActivity"],
    queryFn: () => getDailyActivity(),
  });
};

export const useGetTopUniversitiesQuery = () => {
  const { getTopUniversities } = useAdminStore();
  return useQuery({
    queryKey: ["adminTopUniversities"],
    queryFn: () => getTopUniversities(),
  });
};

export const useGetUsersInfiniteQuery = (search: string) => {
  const { getUsersPage } = useAdminStore();
  return useInfiniteQuery<AdminUsersPage>({
    queryKey: ["adminUsers", search],
    queryFn: ({ pageParam }) => getUsersPage(pageParam as string | undefined, search),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
  });
};
