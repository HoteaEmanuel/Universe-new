import { FaUniversity, FaUserCircle, FaUserEdit } from "react-icons/fa";
import { useAuthStore } from "../store/authStore";
import ProfileImageModal from "../Modals/ProfileImageModal.jsx";
import { FaEdit } from "react-icons/fa";
import { MdModeEdit } from "react-icons/md";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import FollowersModal from "../Modals/FollowersModal.jsx";
import FollowingModal from "../Modals/FollowingModal.jsx";
import {
  useGetFollowersQuery,
  useGetFollowingQuery,
} from "../queryAndMutation/queries/user-queries.js";
import {
  useGetSavedPostsQuery,
  useGetUserPostsQuery,
} from "../queryAndMutation/queries/post-queries";
import { PiStudentFill } from "react-icons/pi";
import { FaPersonRifle } from "react-icons/fa6";
import { useEffect } from "react";
import Profile from "../components/Profile.jsx";
const UserProfile = () => {
  useEffect(() => {
    document.title = "Profile";
  }, []);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const id = user._id;
  const [option, setOption] = useState("posts");
  const [isProfileEditHover, setIsProfileEditHover] = useState(false);

  const { data: posts, isPending: isPendingPosts } = useGetUserPostsQuery(id);
  const { data: savedPosts, isPending: isPendingSaved } =
    useGetSavedPostsQuery(id);

  const handleEditClick = (e, post) => {
    console.log("POST TO EDIT : ", post);
    e.preventDefault();
    e.stopPropagation();
    navigate(`/edit-post/${post._id}`);
  };

  if (isPendingPosts) return <p>Loading the profile...</p>;
  if (isPendingSaved) return <p>Loading the saved posts...</p>;

  console.log("USER POSTS:", posts);
  console.log("USER SAVED POSTS:", savedPosts);
  return (
    <div className="flex flex-col w-full h-full overflow-y-auto">
      <div className="w-full shadow flex-col p-10  justify-center items-center">
        <div className="relative w-full h-1/3 md:h-auto flex justify-end">
          <div className="absolute right-2 top-4">
            {isProfileEditHover && (
              <p className="text-sm text-center mb-2 border rounded-md p-1">
                Edit Profile
              </p>
            )}
          </div>
          <div className="absolute items-center">
            <MdModeEdit
              className="size-4 md:size-8  cursor-pointer violet"
              onMouseEnter={() => setIsProfileEditHover(true)}
              onMouseLeave={() => setIsProfileEditHover(false)}
              onClick={() => navigate(`/users/${user._id}/edit-profile`)}
            />
          </div>
        </div>

        <Profile user={user} />
      </div>
      <div className="w-full flex gap-10 p-5 text-sm overflow-hidden mb-5">
        <button
          className={`text-lg ${option === "posts" && "font-bold"}`}
          onClick={() => setOption("posts")}
        >
          Posts
        </button>
        <button
          className={`text-lg ${option === "saved" && "font-bold"}`}
          onClick={() => setOption("saved")}
        >
          Saved
        </button>
      </div>
      <div className="w-full p-5 overflow-y-auto pb-30 md:p-5 mt-5 md:m-0">
        {(option === "posts" && posts.length === 0 && <p>No posts yet</p>) ||
          (option === "saved" && savedPosts.length === 0 && (
            <p>No saved posts yet</p>
          ))}
        {posts.length === 0 && option==="posts" && (
          <div className="w-full flex flex-col gap-5 justify-center h-full items-center">
            <h1 className="italic">Empty space - give it some love</h1>
            <button
              className="btn btn-primary bg-violet-700 hover:translate-y-1 duration-500 ease-in  "
              onClick={() => navigate("/create-post")}
            >
              Create your first post :)
            </button>
          </div>
        )}
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-20">
          {(option === "posts" ? posts : savedPosts).map((post) => (
            <li
              key={post._id}
              className="p-2 postCard rounded-xl shadow cursor-pointer"
              to={`/post/${post._id}`}
            >
              <Link to={`/post/${post._id}`}>
                {post?.imagesUrls?.length > 0 && (
                  <img
                    src={post.imagesUrls[0]}
                    alt="post image"
                    className="w-full h-100 rounded-2xl rounded-b-none self-center object-cover cursor-pointer"
                  />
                )}
                <div className="relative w-full py-2 border-red-500">
                  <h1 className="font-semibold text-lg w-full">{post.title}</h1>
                  {post?.body && (
                    <h1 className="text-sm break-all w-9/10 line-clamp-2">
                      {post.body}
                    </h1>
                  )}
                  {option === "posts" && (
                    <FaEdit
                      className="absolute top-0 right-0 size-5 main-dark cursor-pointer hover:scale-110 hover:text-violet-600"
                      onClick={(e) => handleEditClick(e, post)}
                    />
                  )}
                </div>
                <ul className="flex gap-2">
                  {post.tags.map((tag) => (
                    <li key={tag + user._id} className="text-xs text-gray-500">
                      #{tag}
                    </li>
                  ))}
                </ul>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UserProfile;
