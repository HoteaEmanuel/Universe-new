import { FaUserCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { IoIosSend } from "react-icons/io";
import { MdMessage } from "react-icons/md";
import {
  useGetUserByNameQuery,
  useIsFollowingQuery,
} from "../queryAndMutation/queries/user-queries.js";
import { useGetUserPostsQuery } from "../queryAndMutation/queries/post-queries";
import {
  useFollowMutation,
  useUnfollowMutation,
} from "../queryAndMutation/mutations/user-mutation.js";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { useGetConversationByUsersIdsQuery } from "../queryAndMutation/queries/conversation-queries.js";
import { useEffect } from "react";
import Profile from "../components/Profile.jsx";
import ProfileSkelet from "../skeletons/ProfileSkelet.jsx";

const OthersProfile = () => {
  useEffect(() => {
    document.title = "User Profile";
  }, []);
  const { name } = useParams();
  const { data: user, isPending: isPendingUser } = useGetUserByNameQuery(name);
  const navigate = useNavigate();
  const { user: loggedUser } = useAuthStore();
  const { data: posts, isPending: isPendingPosts } = useGetUserPostsQuery(
    user?._id,
  );

  const { data: isFollowing, isPending: isPendingCheckFollowing } =
    useIsFollowingQuery(user?._id);
  const { data: conversation, isPendingConversation } =
    useGetConversationByUsersIdsQuery(user?._id);
  console.log(user?._id, loggedUser._id);
  const followMutation = useFollowMutation(user?._id, loggedUser._id);
  const unfollowMutation = useUnfollowMutation(user?._id, loggedUser._id);

  if (isPendingPosts) return <ProfileSkelet />;
  if (isPendingCheckFollowing || isPendingConversation || isPendingUser) {
    return <ProfileSkelet />;
  }
  return (
    <section className="flex flex-col w-full h-full overflow-y-auto">
      <div className="w-full h-1/3 md:h-auto shadow p-10 flex-col justify-center items-center">
        <Profile user={user} />

        <div className="flex gap-3 items-center mt-2">
          <button
            className=" text-xl md:text-lg bg-linear-to-r from-violet-800 to-violet-950 p-1 px-2 text-white rounded-xl hover:scale-105 basic-transition"
            onClick={
              isFollowing
                ? () => unfollowMutation.mutate()
                : () => followMutation.mutate()
            }
          >
            {(isFollowing && "Unfollow") || "Follow"}
          </button>

          <button className="hover:scale-125 basic-transition px-2 p-1">
            <MdMessage
              className="size-6 violet"
              onClick={
                conversation
                  ? () => navigate(`/conversations/${conversation._id}`)
                  : () => navigate(`/new-conversation/${user._id}`)
              }
            />
          </button>
        </div>
      </div>
      <span className="text-lg font-semibold p-2">Posts</span>
      <div className="w-full p-5 overflow-y-auto pb-30 md:p-5">
        {posts.length === 0 ? (
          "No posts yet"
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-20">
            {posts.map((post) => (
              <li
                key={post._id}
                className="p-2 container rounded-xl shadow cursor-pointer"
              >
                <Link to={`/post/${post._id}`}>
                  {post.imagesUrls && post.imagesUrls.length > 0 && (
                    <img
                      src={post.imagesUrls[0]}
                      alt="post image"
                      className="w-full h-100 rounded-2xl rounded-b-none self-center object-cover cursor-pointer"
                    />
                  )}
                  <div className="w-full justify-between p-2 flex flex-col gap-2">
                    <h1 className="font-bold w-full">{post.title}</h1>
                    <h1 className="text-sm break-all w-9/10 line-clamp-5">
                      {post.body}
                    </h1>
                  </div>
                  <ul className="flex gap-2">
                    {post.tags.map((tag) => (
                      <li
                        key={tag + user._id}
                        className="text-xs text-gray-500"
                      >
                        #{tag}
                      </li>
                    ))}
                  </ul>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default OthersProfile;
