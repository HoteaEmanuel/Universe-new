import { Post } from "../../../backend/models/post.model";
import PostCard from "../components/PostCard";
import { useGetPostsQuery } from "../queryAndMutation/queries/post-queries";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useState } from "react";
import { useEffect } from "react";
import { useGetFollowingQuery } from "../queryAndMutation/queries/user-queries";
const HomePage = () => {
  // const { data: posts, isPending } = useGetPostsQuery();
  useEffect(() => {
    document.title = "Home";
  }, []);
  const { user } = useAuthStore();
  const { data: following, isPending: isPendingFollowing } =
    useGetFollowingQuery(user._id);
  const [feedSelector, setFeedSelector] = useState("Global");
  const [feedHovered, setFeedHovered] = useState(false);

  const { data: posts, isPending: isPendingPosts } =
    useGetPostsQuery(feedSelector);

  if (isPendingPosts || isPendingFollowing) return <p>Loading...</p>;
  return (
    <div className="flex flex-1 w-full flex-col justify-center p-10 md:p-0 pb-50 md:pb-10">
      <button
        className="italic md:m-5 mb-10 self-start"
        onMouseEnter={() => setFeedHovered(true)}
      >
        {feedSelector} Feed
      </button>
      {feedHovered && (
        <div
          className="flex flex-col modalContainer p-5 rounded-md w-40 absolute inset-0 md:left-1/4 h-40 md:top-15"
          onMouseLeave={() => setFeedHovered(false)}
        >
          <button
            className={` hover:text-violet-300 p-2 rounded-md mb-2 text-left ${feedSelector === "Global" ? "bg-violet-700" : ""}`}
            onClick={() => {
              setFeedSelector("Global");
              setFeedHovered(false);
            }}
          >
            Global
          </button>
          <button
            className={` hover:text-violet-300 p-2 rounded-md text-left ${feedSelector === "Following" ? "bg-violet-700" : ""}`}
            onClick={() => {
              setFeedSelector("Following");
              setFeedHovered(false);
            }}
          >
            Following
          </button>
          <button
            className={` hover:text-violet-300 p-2 rounded-md text-left ${feedSelector === "University" ? "bg-violet-700" : ""}`}
            onClick={() => {
              setFeedSelector("University");
              setFeedHovered(false);
            }}
          >
            University
          </button>
        </div>
      )}

      {posts && (
        <ul className=" w-full flex flex-col justify-center items-center gap-20 overflow-y-auto min-h-screen md:p-10 ">
          {posts?.map((post) => (
            <li key={post._id} className="w-full md:w-3/4 flex justify-center">
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HomePage;
