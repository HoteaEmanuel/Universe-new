import React, { useState } from "react";
import { useGetUserConversations } from "../queryAndMutation/queries/conversation-queries";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaUserCircle } from "react-icons/fa";
import { FaCircle, FaUserGroup } from "react-icons/fa6";
import { BiMessageSquareAdd } from "react-icons/bi";
import { useMemo } from "react";
import { useEffect } from "react";
import { useGetUserGroups } from "../queryAndMutation/queries/group-queries";
const ChatContainer = () => {
  useEffect(() => {
    document.title = "Chat";
  }, []);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  console.log("USER DIN CONVO");
  console.log(user.id);
  const { data: conversatiiDirecte, isPending: isPendingConversations } =
    useGetUserConversations(null);
  console.log("CONV DATA: ");
  console.log(conversatiiDirecte);
  const { data: groups, isLoading: isLoadingGroups } = useGetUserGroups(
    user.id,
  );

  const { onlineUsers } = useAuthStore();
  console.log("GROUPS: " + groups);
  const [searchTerm, setSearchTerm] = useState("");
  let conversations = conversatiiDirecte;
  const combined_convo_data = useMemo(() => {
    // Guard pentru când datele nu există încă
    if (!conversatiiDirecte?.length) return [];

    for (let i = 0; i < groups?.length; i++) {
      conversations.push(groups[i]);
    }
    return conversations;
  }, [conversatiiDirecte, groups, conversations]);

  console.log("COMBINED CONVO DATA: ");
  console.log(combined_convo_data);
  console.log(onlineUsers);
  const filterConversations = useMemo(() => {
    if (searchTerm.trim().length === 0) return combined_convo_data;
    const query = searchTerm.toLowerCase();
    return combined_convo_data.filter((conversation) => {
      const firstName = conversation?.user?.firstName?.toLowerCase();
      const name = (conversation.user?.name || "").toLowerCase();

      const lastName = (conversation.user?.lastName || "").toLowerCase();
      let fullName = firstName + " " + lastName;
      if (name && !firstName) {
        fullName = name;
      }
      return (
        fullName.includes(query) ||
        conversation.group?.name.toLowerCase().includes(query)
      );
    });
  }, [searchTerm, combined_convo_data]);

  if (isPendingConversations) return <p>Loading...</p>;
  if (isLoadingGroups) return <p>Loading...</p>;
  console.log("GROUPS: ");
  console.log(groups);
  console.log(filterConversations);
  console.log(onlineUsers);

  return (
    <section className="w-full flex  flex-col justify-center p-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl py-5">Your conversations</h1>
        <BiMessageSquareAdd
          className="size-6 cursor-pointer hover:scale-105"
          onClick={() => navigate("/create-conversation")}
        />
      </div>
      <div className="relative w-full">
        <FaSearch className="absolute size-5 top-4 left-2 gray-text" />
        <input
          className="p-3 pl-8 mb-10 border rounded-2xl w-full"
          placeholder="Search contacts or groups ...  "
          onChange={(e) => setSearchTerm(e.target.value)}
        ></input>
      </div>

      <div className="overflow-y-auto w-full">
        {filterConversations.length ? (
          <ul className="flex flex-col gap-4">
            {filterConversations.map((data,index) => (
              <li
                key={index}
                className="commentsContainer flex p-2 rounded-xl cursor-pointer"
                onClick={() => {
                  data.name
                    ? navigate(`/groups/${data.id}`)
                    : navigate(`/conversations/${data.id}`);
                }}
              >
                <div className="relative">
                  {data.user?.profilePicture || data.coverImageUrl ? (
                    <img
                      src={data.user?.profilePicture || data.coverImageUrl}
                      className="size-15 rounded-full"
                      alt="user profile picture"
                    />
                  ) : (
                    <FaUserCircle className="size-15 rounded-full" />
                  )}
                  {data.id && onlineUsers.includes(data.user?.id) && (
                    <FaCircle
                      className={`absolute size-4 -bottom-1  right-1 border-2 border-black rounded-full ${
                        onlineUsers.includes(data.user?.id)
                          && "text-green-500"
                         
                      }`}
                    />
                  )}
                </div>

                <div className="flex flex-col px-2">
                  <p className="text-lg">
                    {data?.user
                      ? (data.user?.firstName || data.user?.name) +
                        " " +
                        (data.user?.accountType === "normal"
                          ? data.user?.lastName
                          : "")
                      : data?.name}
                  </p>
                  <div className="flex items-center text-xs">
                    <span className="px-1 gray-text ">
                      {data.lastMessage?.senderId.id === user.id ||
                      data.lastMessage?.senderId === user.id
                        ? "You: "
                        : data.lastMessage?.senderId.firstName
                          ? "You: "
                          : ""}
                    </span>
                    <span className="italic">
                      {" "}
                      {data.lastMessage?.content
                        ? data.lastMessage?.content
                        : "Image"}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : conversatiiDirecte?.length ? (
          <p className="text-center text-lg">No results</p>
        ) : (
          <p className="text-center text-lg">No conversatios yet</p>
        )}
      </div>
    </section>
  );
};

export default ChatContainer;
