import { useQuery } from "@tanstack/react-query";
import { useConversationStore } from "../../store/conversationStore";
// export const useGetMessagesQuery=()=>{
//     const {} = useC
//     return useQuery({

//     })
// }
export const useGetUserByConvoId = (id) => {
  const { getUserByConvoId } = useConversationStore();
  return useQuery({
    queryFn: () => getUserByConvoId(id),
    queryKey: ["conversations_users", id],
  });
};
export const useGetConvoById = (id) => {
  const { getConvoById } = useConversationStore();
  return useQuery({
    queryFn: () => getConvoById(id),
    queryKey: ["conversations", id],
  });
};
export const useGetUserConversations = (id) => {
  const { getUserConversations } = useConversationStore();
  console.log("GETTIGN THE CONVERS");
  return useQuery({
    queryFn: () => getUserConversations(),
    queryKey: ["user-conversations", id],
  });
};
export const useGetConvoMessages = (id) => {
  const { getMessages } = useConversationStore();
  return useQuery({
    queryFn: () => getMessages(id),
    queryKey: ["conversation_messages", id],
    // refetchOnWindowFocus: true,
    // staleTime:0, // refetch când revii pe tab
    // refetchOnMount: true,
  });
};
export const useGetLiveMessages = (id) => {
  const { socket } = useConversationStore();
  return useQuery({
    queryFn: () => {
      socket.on("newMessage", (message) => {
        return message;
      });
    },
    queryKey: ["conversation_messages", id],
    // refetchOnWindowFocus: true,
    // staleTime:0, // refetch când revii pe tab
    // refetchOnMount: true,
  });
};
export const useGetConversationByUsersIdsQuery = (id) => {
  const { getConversationByUsersIds } = useConversationStore();
  return useQuery({
    queryFn: () => getConversationByUsersIds(id),
    queryKey: ["conversations"],
  });
};

export const useGetConvoUsers = () => {
  const { getConvoUsers } = useConversationStore();
  return useQuery({   
    queryFn: () => getConvoUsers(),
    queryKey: ["convo-users"],
  });
} 
