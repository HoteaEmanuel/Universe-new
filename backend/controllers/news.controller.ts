import type { Request, Response } from "express";
import axios from "axios";
import { newsCache } from "../lib/caches.js";

interface GNewsArticle {
  title: string;
  description?: string;
  content?: string;
}

export const getNews = async (req: Request, res: Response) => {
  const category = req.params.category as string;
  try {
    const filteredArticles = await newsCache.getOrSet(`news-${category}`, async () => {
      const response = await axios.get("https://gnews.io/api/v4/top-headlines", {
        params: {
          q: category,
          topic: category,
          lang: "en",
          max: 100,
          apikey: process.env.GNEWS_API_KEY,
        },
      });

      // Get only the articles that are relevant to the category
      // Relevant means that the category is mentioned in the title, description or content of the article
      return response.data.articles.filter((article: GNewsArticle) => {
        const searchTerm = category.toLowerCase();
        const title = article.title.toLowerCase();
        const description = article.description?.toLowerCase() || "";
        const content = article.content?.toLowerCase() || "";
        return (
          title.includes(searchTerm) ||
          description.includes(searchTerm) ||
          content.includes(searchTerm)
        );
      });
    });
    return res.status(200).json(filteredArticles);
  } catch (error) {
    return res.status(400).json(error);
  }
};

export const getTopNews = async (req: Request, res: Response) => {
  const limit = req.query.limit || 100;
  try {
    const articles = await newsCache.getOrSet(`top-news-${limit}`, async () => {
      const response = await axios.get("https://gnews.io/api/v4/top-headlines", {
        params: {
          lang: "en",
          max: limit,
          apikey: process.env.GNEWS_API_KEY,
          category: "general",
        },
      });
      return response.data.articles;
    });
    return res.status(200).json(articles);
  } catch (error) {
    return res
      .status(500)
      .json({ error: error instanceof Error ? error.message : "Something went wrong" });
  }
};
