import { useQuery } from "@tanstack/react-query";
import axios from "axios";
const API_URL =
  import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000/api";
export const useGetTopNewsQuery = () => {
  return useQuery({
    queryFn: async () => {
        const response = await axios.get(`${API_URL}/top-news`);
        const data = await response.data;
        return data;
    },
    queryKey: ["topNews"],
  });
};