import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000/api";

export type NewsArticle = {
  title: string;
  url: string;
  image?: string;
  description?: string;
  publishedAt: string;
};

export const useGetTopNewsQuery = () => {
  return useQuery({
    queryFn: async () => {
      const response = await axios.get<NewsArticle[]>(`${API_URL}/top-news`);
      return response.data;
    },
    queryKey: ["topNews"],
  });
};

export const useGetNewsByCategoryQuery = (category: string) => {
  return useQuery({
    queryFn: async () => {
      const response = await axios.get<NewsArticle[]>(`${API_URL}/news/${category}`);
      return response.data;
    },
    queryKey: ["news", category],
    enabled: !!category,
  });
};
