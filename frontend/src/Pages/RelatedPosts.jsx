import React from "react";
import { useGetRelatedPostsQuery } from "../queryAndMutation/queries/post-queries";
import { useParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import { useEffect } from "react";
const RelatedPosts = () => {
  useEffect(() => {
    document.title = "Related Posts";
  }, []);
  const tag = useParams().tag;
  console.log(tag);
  const { data: posts, isLoading: isLoadingRecentPosts } =
    useGetRelatedPostsQuery(tag);
  if (isLoadingRecentPosts) return <p>Loading...</p>;
  return (
    <div className="p-10">
      <h2 className="text-2xl font-bold mb-4">Related Posts</h2>
      <ul className="space-y-4 p-10">
        {posts && posts.map((post) => <PostCard key={post.id} post={post} />)}
      </ul>
    </div>
  );
};

export default RelatedPosts;
