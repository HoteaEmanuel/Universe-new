import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import type { createAdminApi } from "../api/admin.js";
import { adminKeys } from "../queries/keys.js";

type AdminApi = ReturnType<typeof createAdminApi>;

export const createAdminMutations = (api: AdminApi, queryClient: QueryClient) => ({
  blockUser: () =>
    mutationOptions({
      mutationFn: ({ id, reason }: { id: string; reason?: string }) => api.blockUser(id, reason),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminKeys.usersAll() });
        queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      },
    }),

  unblockUser: () =>
    mutationOptions({
      mutationFn: (id: string) => api.unblockUser(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminKeys.usersAll() });
        queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      },
    }),
});
