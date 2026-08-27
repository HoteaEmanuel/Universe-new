import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAdminStore } from "@/store/adminStore";

export const useBlockUserMutation = () => {
  const { blockUser } = useAdminStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => blockUser(id, reason),
    onError: () => {
      toast.error("Could not block user");
    },
    onSuccess: () => {
      toast.success("User blocked");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
};

export const useUnblockUserMutation = () => {
  const { unblockUser } = useAdminStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unblockUser(id),
    onError: () => {
      toast.error("Could not unblock user");
    },
    onSuccess: () => {
      toast.success("User unblocked");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
};
