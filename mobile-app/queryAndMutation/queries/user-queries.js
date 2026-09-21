import { useUserStore } from "../../store/userStore";
import { useQuery } from "@tanstack/react-query";
export const useGetAllUsersQuery = () => {
  const { getAllUsers } = useUserStore();
  return useQuery({ 
    queryFn: async () => await getAllUsers(),
    queryKey: ["allUsers"],
  });
}
export const useGetUserByIdQuery = (id) => {
  const { getUserById } = useUserStore();
  return useQuery({
    queryFn: async () => await getUserById(id),
    queryKey: ["user", id],
  });
};
export const useGetFollowingQuery = (id) => {
  const { getFollowing } = useUserStore();
  return useQuery({
    queryFn: () => getFollowing(id),
    queryKey: ["following", id],
  });
};
export const useGetFollowersQuery = (id) => {
  const { getFollowers } = useUserStore();
  return useQuery({
    queryFn: () => getFollowers(id),
    queryKey: ["followers", id],
  });
};
export const useIsFollowingQuery = (id) => {
  const { isFollowing } = useUserStore();
  return useQuery({
    queryFn: () => isFollowing(id),
    queryKey: ["isFollowing", id],
  });
};

export const useGetUserByNameQuery=(name)=>{
  const { getUserByName } = useUserStore();
  return useQuery({
    queryFn: async () => await getUserByName(name),
    queryKey: ["userByName", name],
  });
}