import React from "react";
import { CiSearch } from "react-icons/ci";
import axios from "axios";
import { useState } from "react";
import { formatToLocalDate } from "../utils/formatDatetoLocal";
const API_URL =
  import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000/api";
import { useUserStore } from "../store/userStore";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useDebounce } from "../hooks/Debounce";
import { useQuery } from "@tanstack/react-query";
import ClipLoader from "react-spinners/ClipLoader";
import { usePostStore } from "../store/postStore";
import PostCard from "../components/PostCard";
import { useGetTopNewsQuery } from "../queryAndMutation/queries/news-queries";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
const Explore = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [searched, setSearched] = useState(false);
  const [searchTermText, setSearchedTermText] = useState("");
  const [searchedUsers, setSearchedUsers] = useState([]);
  const { getAllUsers } = useUserStore();
  const { getPostsByName, getPostsByTag } = usePostStore();
  const { user: authUser } = useAuthStore();
  const debouncedSearch = useDebounce(searchTerm, 1500);
  useEffect(() => {
    document.title = "Explore";
  }, []);
  const { data, isLoading } = useQuery({
    queryKey: ["news", debouncedSearch],
    queryFn: () =>
      axios.get(`${API_URL}/news/${debouncedSearch}`).then((res) => res.data),
    enabled: debouncedSearch?.length > 2,
  });

  const { data: topNews, isLoading: isLoadingTopNews } = useGetTopNewsQuery();
  const topics = [
    "stiinta",
    "tehnologie",
    "sport",
    "politica",
    "afaceri",
    "entertainment",
    "educatie",
  ];
  const { isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users", debouncedSearch],
    queryFn: async () => {
      const allUsers = await getAllUsers();
      let matchingUsers = [];
      const searchedTerm = debouncedSearch.toLowerCase();
      matchingUsers = allUsers.filter((value) => {
        const fullName =
          (value.firstName?.toLowerCase() || value.name?.toLowerCase()) +
          " " +
          (value?.lastName?.toLowerCase() || "");
        const university = value.university?.toLowerCase() || "";
        console.log(fullName, searchedTerm, university);
        return (
          fullName.includes(searchedTerm) || university.includes(searchedTerm)
        );
      });
      setSearchedUsers(matchingUsers);
      setSearchedTermText(debouncedSearch);
      setSearched(true);
      return matchingUsers;
    },
    enabled: debouncedSearch?.length > 2,
  });

  const { data: postsByNameData, isLoading: isLoadingPosts } = useQuery({
    queryKey: ["postsByName", debouncedSearch],
    queryFn: async () => {
      const response = getPostsByName(debouncedSearch);

      // setPosts(response);
      return response;
    },
    enabled: debouncedSearch?.length > 2,
  });

  const { data: postsByTagData, isLoading: isLoadingPostsByTag } = useQuery({
    queryKey: ["postsByTag", debouncedSearch],
    queryFn: async () => {
      const response = getPostsByTag(debouncedSearch);

      // setPosts(response);
      return response;
    },
    enabled: debouncedSearch?.length > 2,
  });

  useEffect(() => {
    if (debouncedSearch !== searchParams.get("search")) {
      const params = new URLSearchParams(searchParams);
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      } else {
        params.delete("search");
      }
      setSearchParams(params, { replace: true });
    }
  }, [searchParams, debouncedSearch, setSearchParams]);
  if (isLoadingUsers || isLoadingPosts || isLoadingPostsByTag)
    return <ClipLoader color="#8b5cf6" size={50} className="mx-auto mt-20" />;

  // const handleSearch = async (e) => {
  //   e.preventDefault();

  //   const users = await getAllUsers();
  //   let matchingUsers = [];
  //   const name = searchTerm.toLowerCase();
  //   matchingUsers = users.filter((value) => {
  //     const fullName =
  //       value.firstName.toLowerCase() + " " + value.lastName.toLowerCase();
  //     console.log(fullName, name);
  //     return fullName.includes(name);
  //   });
  //   setSearchedUsers(matchingUsers);

  //   if (response) setPosts(response.data);
  //   users;
  //   setSearched(true);
  //   setSearchedTermText(searchTerm);
  // };
  console.log(debouncedSearch);
  console.log(posts);
  console.log(searchedUsers);
  if (
    isLoadingTopNews ||
    isLoadingUsers ||
    isLoadingPosts ||
    isLoadingPostsByTag ||
    isLoading
  )
    return <ClipLoader color="#8b5cf6" size={50} className="mx-auto mt-20" />;
  // console.log(data);
  return (
    <div>
      <div className="flex w-full p-5">
        <div className="block md:flex w-full items-center">
          {/* <h1 className="text-xl font-semibold mb-5 md:m-0 md:px-10">Search</h1> */}
          <form
            className="relative flex w-full md:w-1/2 items-center rounded-xl border p-2 mx-5"
            onSubmit={(e) => e.preventDefault()}
          >
            <CiSearch className="size-8" />
            <input
              className="p-4 w-full outline-none rounded-xl"
              placeholder="Search for People, Events, Posts,  News ..."
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSearchParams({ search: e.target.value });
              }}
            />
          </form>
        </div>
      </div>

      {searchTerm.length == 0 && (
        <h1 className="text-2xl mx-10 font-semibold">Top topics</h1>
      )}
      <ul className="flex gap-4 m-10">
        {topics.map((topic) => (
          <li
            key={topic}
            className="cursor-pointer border p-2 rounded-2xl bg-violet-800 hover:scale-105 hover:bg-violet-600 text-gray-200"
            onClick={() => setSearchTerm(topic)}
          >
            {topic.charAt(0).toUpperCase() + topic.slice(1)}
          </li>
        ))}
      </ul>
      {topNews && topNews.length > 0 && searchTerm.length == 0 && (
        <ul className="p-10 flex flex-col gap-4">
          {topNews.map((newsItem) => (
            <li
              key={newsItem.title}
              className="cursor-pointer border flex p-2 rounded-2xl hover:scale-105"
              onClick={() => window.open(newsItem.url, "_blank")}
            >
              <div className="w-2/3 flex flex-col gap-4 select-text">
                <h1 className="text-2xl">{newsItem.title} </h1>
                <p>{formatToLocalDate(newsItem.publishedAt)}</p>
                <p className="text-justify">{newsItem.description}</p>
                <div className="flex">
                  <span>Read more </span>
                  <a
                    className="text-blue-300 select-text cursor-pointer px-2"
                    href={newsItem.url}
                  >
                    here
                  </a>
                </div>
              </div>
              <div className="w-1/3 flex items-center justify-center">
                <img src={newsItem.image} className="size-50 object-cover" />
              </div>
            </li>
          ))}
        </ul>
      )}
      {postsByNameData &&
        postsByNameData.length === 0 &&
        searchedUsers.length === 0 &&
        postsByTagData.length === 0 &&
        searched &&
        data.length == 0 && (
          <h1 className="ml-10 mt-10">
            No results found for:{" "}
            <span className="font-bold">{searchTermText}</span>
          </h1>
        )}
      {searchedUsers.length > 0 && (
        <div className="p-10">
          <h1 className="font-semibold text-xl">Accounts</h1>
          <ul className="w-full flex flex-col gap-4 p-10 ">
            {searchedUsers.map((user) => {
              return (
                <li
                  key={user.id}
                  className="w-full flex justify-center gap-4 border p-2 border-violet-950 rounded-2xl cursor-pointer"
                  onClick={() => {
                    user.id === authUser.id
                      ? navigate("/profile")
                      : navigate(`/user/profile/${user.id}`);
                  }}
                >
                  {user.profilePicture && (
                    <img
                      src={user.profilePicture}
                      alt="user's profile picture"
                      className="size-10 rounded-full"
                    />
                  )}
                  <h1>
                    {user.accountType === "business"
                      ? user.name
                      : `${user.firstName} ${user.lastName}`}
                  </h1>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {postsByNameData && postsByNameData.length > 0 && (
        <div>
          {searched && searchTermText.length > 0 && (
            <h1 className="ml-10 mt-10">
              Search results for:{" "}
              <span className="font-bold">{searchTermText}</span>
            </h1>
          )}
          {searchTermText.length > 0 &&
            postsByNameData.length === 0 &&
            searchedUsers.length === 0 && (
              <h1 className="ml-10 mt-10">
                No results found for:{" "}
                <span className="font-bold">{searchTermText}</span>
              </h1>
            )}
          <h1 className="ml-10 mt-10 font-semibold text-xl">Posts found</h1>
          <ul className="w-full h-screen flex flex-col gap-4 p-10">
            {postsByNameData.map((post) => {
              return (
                <li key={post.id}>
                  <PostCard post={post} />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {postsByTagData && postsByTagData.length > 0 && (
        <div>
          {searched && searchTermText.length > 0 && (
            <h1 className="ml-10 mt-10">
              Search results for:{" "}
              <span className="font-bold">{searchTermText}</span>
            </h1>
          )}
          <h1 className="ml-10 mt-10 font-semibold text-xl">
            Posts found by tag
          </h1>
          <ul className="w-full h-screen flex flex-col gap-4 p-10">
            {postsByTagData.map((post) => {
              return (
                <li key={post.id}>
                  <PostCard post={post} />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {data && data.length > 0 && (
        <div>
          <h1 className="ml-10 mt-10 font-semibold text-xl">
            News Articles - {searchTermText}
          </h1>
          <ul className="w-full h-screen flex flex-col gap-4 p-10">
            {data.map((post) => {
              return (
                <li
                  key={post.id}
                  className="w-full flex border rounded-4xl p-10 hover:scale-105"
                >
                  <div className="w-2/3 flex flex-col gap-4 select-text">
                    <h1 className="text-2xl">{post.title} </h1>
                    <p>{formatToLocalDate(post.publishedAt)}</p>
                    <p className="text-justify">{post.description}</p>
                    <div className="flex">
                      <span>More on: </span>
                      <a
                        className="text-blue-300 select-text cursor-pointer px-2"
                        href={post.url}
                      >
                        Here
                      </a>
                    </div>
                  </div>
                  <div className="w-1/3 flex items-center justify-center">
                    <img src={post.image} className="size-50 object-cover" />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Explore;
