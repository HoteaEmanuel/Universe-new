import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useBlockStore } from "../../store/blockStore";

const invalidateAfterBlockChange = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
  queryClient.invalidateQueries({ queryKey: ["user-conversations"] });
  queryClient.invalidateQueries({ queryKey: ["archived-conversations"] });
  queryClient.invalidateQueries({ queryKey: ["conversation_messages"] });
};

export const useBlockUserMutation = () => {
  const queryClient = useQueryClient();
  const { blockUser } = useBlockStore();
  return useMutation({
    mutationFn: (userId: string) => blockUser(userId),
    onSuccess: () => {
      invalidateAfterBlockChange(queryClient);
      toast.success("User blocked");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useUnblockUserMutation = () => {
  const queryClient = useQueryClient();
  const { unblockUser } = useBlockStore();
  return useMutation({
    mutationFn: (userId: string) => unblockUser(userId),
    onSuccess: () => {
      invalidateAfterBlockChange(queryClient);
      toast.success("User unblocked");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};
