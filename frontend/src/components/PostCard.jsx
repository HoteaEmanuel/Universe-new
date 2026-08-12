import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useRef } from "react";
import { FaComments, FaUserCircle } from "react-icons/fa";
import { MdChatBubble, MdFavorite, MdFavoriteBorder } from "react-icons/md";
import { LuBookmarkPlus } from "react-icons/lu";
import { GoBookmarkSlashFill } from "react-icons/go";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  useGetLikesQuery,
  usePostLikedQuery,
  usePostUserQuery,
} from "../queryAndMutation/queries/post-queries";
import { useIsFollowingQuery } from "../queryAndMutation/queries/user-queries";
import {
  useFollowMutation,
  useSavePostMutation,
  useUnfollowMutation,
  useUnsavePostMutation,
} from "../queryAndMutation/mutations/user-mutation";
import { useGetPostCommentsCount } from "../queryAndMutation/queries/comments-queries";
import {
  useLikeMutation,
  useUnlikeMutation,
} from "../queryAndMutation/mutations/post-mutation";
import { formatDateDetailed } from "../utils/formatDate";
import LikesModal from "../Modals/LikesModal";
import { urlPathName } from "../utils/urlPathFromName";
import ImageSlider from "./ImageSlider";
import PostSkelet from "../skeletons/PostSkelet";
const PostCard = ({ post }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { userId } = post;
  const postId = post._id;
  const [showMore, setShowMore] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const [isSaved, setIsSaved] = useState(post.isSaved);
  const bodyRef = useRef(null);
  const [showLikesModal, setShowLikesModal] = useState(false);
  useEffect(() => {
    const body = bodyRef.current;
    if (body) {
      if (body.scrollHeight > body.clientHeight) {
        setIsClamped(true);
      }
    }
  }, []);

  const { data: creator, isPending: isPendingPostUser } = usePostUserQuery(
    userId,
    postId,
  );

  const { data: liked, isPending: isPendingCheckLiked } =
    usePostLikedQuery(postId);

  const { data: isFollowing, isPending: isPendingIsFollowing } =
    useIsFollowingQuery(userId);
  const { data: likes, isPending: isPendingLikes } = useGetLikesQuery(postId);
  const { data: commentsCount, isPending: isPendingCommentsCount } =
    useGetPostCommentsCount(postId);
  const likeMutation = useLikeMutation(postId);
  const unlikeMutation = useUnlikeMutation(postId);
  const { mutate: savePostMutation } = useSavePostMutation(postId, user._id);
  const followMutation = useFollowMutation(userId, user._id);
  const unfollowMutation = useUnfollowMutation(userId, user._id);
  const { mutate: unsavePostMutation } = useUnsavePostMutation(
    postId,
    user._id,
  );

  const [showSaveOption, setShowSaveOption] = useState(false);
  const postTime = formatDateDetailed(post.createdAt.toString());
  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const prevLikes =
      queryClient.getQueryData(["likes", postId]) ?? post.likes.length;
    const prevLiked =
      queryClient.getQueryData(["userLiked", postId]) ?? !!liked;

    queryClient.setQueryData(
      ["likes", postId],
      (old) =>
        (typeof old === "number" ? old : prevLikes) + (prevLiked ? -1 : 1),
    );
    queryClient.setQueryData(["userLiked", postId], !prevLiked);

    try {
      if (!prevLiked) {
        likeMutation.mutate();
      } else {
        unlikeMutation.mutate();
      }
    } catch (err) {
      queryClient.setQueryData(["likes", postId], prevLikes);
      queryClient.setQueryData(["userLiked", postId], prevLiked);
    }
  };
  const fullName = urlPathName(creator);
  const handleProfileClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (userId !== user._id) {
      navigate(`/users/${fullName}`);
    } else {
      navigate("/profile");
    }
  };

  const handleFollowClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    followMutation.mutate(userId);
  };

  const handleUnfollowClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    unfollowMutation.mutate(userId);
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    savePostMutation(undefined, {
      onSuccess: () => {
        console.log("SAVED WAS SUCCESSFUL");
        setIsSaved(true);
      },
      onError: (error) => {
        console.error("Save failed:", error);
      },
    });
  };

  const handleSeeMoreClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMore(!showMore);
  };
  const handleSeeRelated = (e, tag) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/related-posts/${tag}`);
  };
  const handleSeeLikesModal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowLikesModal(true);
  };
  const handleUnSavePostClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    unsavePostMutation(undefined, {
      onSuccess: () => {
        console.log("UNSAVED WAS SUCCESSFUL");
        setIsSaved(false);
      },
    });
  };
  if (
    isPendingCheckLiked ||
    isPendingIsFollowing ||
    isPendingPostUser ||
    isPendingLikes ||
    isPendingCommentsCount
  )
    return <PostSkelet/>;
  const { firstName, name, lastName, profilePicture } = creator;
  return (
    <Link
      to={`/post/${postId}`}
      className="flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {(profilePicture && (
          <img
            src={profilePicture}
            alt="profile picture"
            className="size-9 rounded-full object-cover cursor-pointer"
            onClick={handleProfileClick}
          />
        )) || (
          <FaUserCircle
            className="size-9 text-muted-foreground cursor-pointer"
            onClick={handleProfileClick}
          />
        )}
        <div className="flex w-full items-center justify-between">
          <div>
            <p className="text-sm font-semibold leading-tight">
              {firstName || name} {lastName}
            </p>
            <p className="text-xs text-muted-foreground">
              {postTime}
              {post?.location && " · " + post.location}
            </p>
          </div>

          {(!isFollowing && userId !== user._id && (
            <button
              className="rounded-full px-2 py-1 text-xs font-semibold text-primary transition-transform duration-200 ease-in hover:scale-105"
              onClick={handleFollowClick}
            >
              Follow
            </button>
          )) ||
            (userId !== user._id && isFollowing && (
              <button
                className="rounded-full px-2 py-1 text-xs text-muted-foreground transition-transform duration-200 ease-in hover:scale-105"
                onClick={handleUnfollowClick}
              >
                Following
              </button>
            ))}
        </div>
      </div>

      {post.imagesUrls?.length === 1 && (
        <img
          src={post.imagesUrls[0]}
          alt="post image"
          className="aspect-square w-full self-center object-cover"
        />
      )}
      {post.imagesUrls?.length > 1 && <ImageSlider images={post.imagesUrls} />}

      <div className="flex items-center gap-4 px-4 pt-3">
        <button className="hover:scale-110" onClick={(e) => handleLike(e)}>
          {(liked && (
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="heartGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="50%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#2f0d68" />
                </linearGradient>
              </defs>
              <path
                fill="url(#heartGradient)"
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42
       4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76
       3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55
       11.54L12 21.35z"
              />
            </svg>
          )) || (
            <MdFavoriteBorder className="size-6.5 text-foreground/80 hover:text-foreground" />
          )}
        </button>
        <button>
          <FaComments className="size-6 text-foreground/80 hover:text-foreground" />
        </button>
        <div className="relative ml-auto">
          {userId !== user._id && !post.isSaved && !isSaved && (
            <LuBookmarkPlus
              className="size-6 text-foreground/80 hover:scale-110 hover:text-foreground cursor-pointer"
              onClick={handleSaveClick}
              onMouseEnter={() => setShowSaveOption("Save post")}
              onMouseLeave={() => setShowSaveOption(false)}
            />
          )}
          {userId !== user._id && post.isSaved && isSaved && (
            <GoBookmarkSlashFill
              className="size-6 text-primary hover:scale-110 cursor-pointer"
              onClick={handleUnSavePostClick}
              onMouseEnter={() => setShowSaveOption("Unsave post")}
              onMouseLeave={() => setShowSaveOption(false)}
            />
          )}
          {showSaveOption && (
            <span className="absolute right-0 top-8 whitespace-nowrap rounded-md bg-gray-900 p-1 text-[10px] text-white">
              {showSaveOption}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 pt-2">
        <span
          className="cursor-pointer text-sm font-semibold"
          onClick={handleSeeLikesModal}
        >
          {likes} {likes === 1 ? "like" : "likes"}
        </span>
        {commentsCount > 0 && (
          <span className="ml-3 text-sm text-muted-foreground">
            {commentsCount} {commentsCount === 1 ? "comment" : "comments"}
          </span>
        )}
      </div>

      {showLikesModal && likes > 0 && (
        <LikesModal
          open={showLikesModal}
          onClose={() => setShowLikesModal(false)}
          postId={postId}
        />
      )}

      <div className="px-4 pt-2">
        {post?.title && (
          <span className="mr-1.5 text-sm font-semibold">{post.title}</span>
        )}
        {post?.body && (
          <span
            className={`text-sm wrap-break-word ${!showMore && "line-clamp-3"}`}
            ref={bodyRef}
          >
            {post.body}
          </span>
        )}
        {isClamped && (
          <button
            className="block text-xs text-muted-foreground hover:text-foreground"
            onClick={handleSeeMoreClick}
          >
            {showMore ? "See less" : "See more"}
          </button>
        )}
      </div>

      {post.tags?.length > 0 && (
        <ul className="flex flex-wrap gap-2 px-4 pt-2 pb-4">
          {post.tags.map((tag) => (
            <li
              key={tag + userId}
              className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={(e) => handleSeeRelated(e, tag)}
            >
              #{tag}
            </li>
          ))}
        </ul>
      )}
      {!post.tags?.length && <div className="pb-2" />}
    </Link>
  );
};

export default PostCard;
