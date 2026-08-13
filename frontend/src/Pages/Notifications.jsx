import React, { useEffect } from "react";
import { useGetUserNotifications } from "../queryAndMutation/queries/notifications-queries";
import { useAuthStore } from "../store/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { useSeeNotifications } from "../queryAndMutation/mutations/notification-mutation";
import { useNavigate } from "react-router-dom";
import { urlPathName } from "../utils/urlPathFromName";
import { formatDateDetailed } from "../utils/formatDate";

const Notifications = () => {
  const navigate = useNavigate();
  const { user, socket } = useAuthStore();
  
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useGetUserNotifications(user.id);

  const { mutate: seeNotifications } = useSeeNotifications(user.id);

  useEffect(() => {
    const timeOutId = setTimeout(() => {
      seeNotifications();
    }, 2000);
    return () => {
      clearTimeout(timeOutId);
    };
  }, [seeNotifications]);

  useEffect(() => {
    socket.on("newNotification", (notification) => {
      console.log(notification);
      queryClient.invalidateQueries(["unread-notifications", user.id]);
      queryClient.invalidateQueries(["notifications",user.id]);
    });
  }, [socket, user.id, queryClient]);
  if (isLoading) return <h1>Loading..</h1>;
  console.log("NOTIFICATIONS: ", notifications);

  return (
    <div className="w-full h-full p-2">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <ul className="w-full h-full flex flex-col gap-5 mt-10 p-5 ">
        {notifications.map((notif) => (
          <li
            key={notif.id}
            className="flex flex-col items-center justify-center p-2"
          >
            {notif.actionUser && notif.actionUser.profilePicture && (
              <img
                src={notif.actionUser.profilePicture}
                className="w-10 h-10 rounded-full object-cover"
                onClick={() =>
                  navigate(`/users/${urlPathName(notif.actionUser)}`)
                }
              />
            )}
            <p className={`${notif.read === false && "font-semibold"}`}>
              {notif.message}
            </p>
            <time className="text-xs text-gray-500">
              {formatDateDetailed(notif.createdAt)}
            </time>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notifications;
