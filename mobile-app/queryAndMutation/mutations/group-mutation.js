import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGroupStore } from "../../store/groupStore";
import { toast } from "sonner";
export const useCreateGroupMutation = () => {
  const queryClient = useQueryClient();
  const { createGroup } = useGroupStore();
  return useMutation({
    mutationFn: async ({ name, description }) => {
      console.log(name, description);
      await createGroup({ name, description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Group created");
    },
  });
};
export const useSendMessageToGroupMutation = (id) => {
  const queryClient = useQueryClient();
  const { sendMessageToGroup } = useGroupStore();
  return useMutation({
    mutationFn: async ({ id, message }) =>
      await sendMessageToGroup(id, message),
    onSuccess: () => {
      console.log(id);
      queryClient.invalidateQueries(["group-messages", id]);
    },
  });
};

export const useEditMessageInGroupMutation = (messageId) => {
  const queryClient = useQueryClient();
  const { editMessageInGroup } = useGroupStore();
  return useMutation({
    mutationFn: async ({ id, newContent }) =>
      await editMessageInGroup(id, newContent),
    onSuccess: () => {
      console.log(messageId);
      queryClient.invalidateQueries(["group-messages", messageId]);
    },
  });
};

export const useDeleteMessageInGroupMutation = (messageId) => {
  const queryClient = useQueryClient();
  const { deleteMessageInGroup } = useGroupStore();
  return useMutation({
    mutationFn: async () => await deleteMessageInGroup(messageId),
    onSuccess: () => {
      console.log(messageId);
      queryClient.invalidateQueries(["group-messages", messageId]);
    },
  });
};

export const useAddMemberToGroupMutation = (groupId) => {
  const queryClient = useQueryClient();
  const { addMemberToGroup } = useGroupStore();
  return useMutation({
    mutationFn: async (userId) => {
      await addMemberToGroup(groupId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
      toast.success("Member added to group");
    },
  });
};

export const useLeaveGroupMutation = () => {
  const queryClient = useQueryClient();
  const { leaveGroup } = useGroupStore();
  console.log("LEAVE GROUP MUTATION");
  return useMutation({
    mutationFn: async (groupId) => {
      await leaveGroup(groupId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-groups"] });
      toast.success("You have left the group");
    },
  });
};

export const usePromoteMemberToAdminMutation = (groupId) => {
  const queryClient = useQueryClient();
  const { makeUserAdmin } = useGroupStore();
  return useMutation({
    mutationFn: async (userId) => {
      await makeUserAdmin(groupId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
    },
  });
};

export const useUpdateGroupImageMutation = (groupId) => {
  const queryClient = useQueryClient();
  const { updateGroupImage } = useGroupStore();
  return useMutation({
    mutationFn: async (imageData) => {
      await updateGroupImage(groupId, imageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      toast.success("Group image updated");
    },
  });
};
