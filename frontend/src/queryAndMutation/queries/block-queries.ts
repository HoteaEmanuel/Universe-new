import { useQuery } from "@tanstack/react-query";
import { useBlockStore } from "../../store/blockStore";
import type { BlockedUser } from "../../features/chat/types";

export const useGetBlockedUsers = (enabled = true) => {
  const { getBlockedUsers } = useBlockStore();
  return useQuery<BlockedUser[]>({
    queryFn: () => getBlockedUsers(),
    queryKey: ["blocked-users"],
    enabled,
  });
};
