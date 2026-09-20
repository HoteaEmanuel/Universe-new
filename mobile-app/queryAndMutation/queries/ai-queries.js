import { useQuery } from "@tanstack/react-query";
import axios from "axios";
const API_URL =
  import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000/api";
export const useGetAiHashtagsQuery = (caption,debouncedSearch) => {
  console.log("HEREEEE" + caption + "CAPTION" + caption.length);
  return useQuery({
    enabled: caption.length > 2 && debouncedSearch.length > 2,
    queryFn: async () => {
      const response = await axios.post(`${API_URL}/ai/hashtags`, {
        postContent:caption
      });
      return response.data;
    },
    queryKey: ["aiHashtags", caption, debouncedSearch],
  });
};
