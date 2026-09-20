import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConversationStore } from "../../store/conversationStore";

export const useSendMessageMutation = (id) => {
  const queryClient = useQueryClient();
  const { sendMessage } = useConversationStore();
  return useMutation({
    mutationFn: async ({ id, message }) => {
      console.log(id, message);
      await sendMessage(id, message);
    },
    onSuccess: () => {
      console.log(id);
      queryClient.invalidateQueries(["conversation_messages", id]);
    },
  });
};

export const useDeleteMessageMutation = (id) => {
  const queryClient = useQueryClient();
  const { deleteMessage } = useConversationStore();
  return useMutation({
    mutationFn: async () => await deleteMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["conversation_messages", id]);
    },
  });
};

export const useEditMessageMutation = (id) => {
  const queryClient = useQueryClient();
  const { editMessage } = useConversationStore();
  return useMutation({
    mutationFn: async ({ id, newContent }) => await editMessage(id, newContent),
    onSuccess: () => {
      queryClient.invalidateQueries(["conversation_messages", id]);
    },
  });
};

// export const useStartConversationMutation = (id) => {
//   const queryClient = useQueryClient();
//   const { startConversation } = useConversationStore();
//   return useMutation({
//     mutationFn: async ({ id, message }) => {
//       console.log(id, message);
//       await startConversation(id, message);
//     },
//     onSuccess: (response) => {
//       queryClient.invalidateQueries(["conversation_messages", id]);
//       console.log(response);
//     },
//   });
// };
