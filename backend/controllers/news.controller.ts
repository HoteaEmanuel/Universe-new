import type { Request, Response } from "express";
import axios from "axios";
// Redis disabled for dev (avoid burning Upstash quota) — see lib/redis.js
// import { redis } from "../lib/redis.js";

interface GNewsArticle {
  title: string;
  description?: string;
  content?: string;
}

export const getNews = async (req: Request, res: Response) => {
  const category = req.params.category as string;
  try {
    let categoryNews = null;
    // Redis disabled for dev (avoid burning Upstash quota) — see lib/redis.js
    // try {
    //   categoryNews = await redis.get(`news - ${category}`);
    // } catch (cacheError) {
    //   console.warn("Redis cache read failed (non-fatal):", cacheError);
    // }
    if (categoryNews) return res.status(200).json(categoryNews);
    const response = await axios.get("https://gnews.io/api/v4/top-headlines", {
      params: {
        q: category,
        topic: category,
        lang: "ro",
        max: 100,
        apikey: process.env.GNEWS_API_KEY,
      },
    });
    console.log("CATEGORY NEWS");

    // Get only the articles that are relevant to the category
    // Relevant means that the category is mentioned in the title, description or content of the article

    const filteredArticles = response.data.articles.filter(
      (article: GNewsArticle) => {
        const searchTerm = category.toLowerCase();
        const title = article.title.toLowerCase();
        const description = article.description?.toLowerCase() || "";
        const content = article.content?.toLowerCase() || "";
        return (
          title.includes(searchTerm) ||
          description.includes(searchTerm) ||
          content.includes(searchTerm)
        );
      },
    );

    // Redis disabled for dev (avoid burning Upstash quota) — see lib/redis.js
    // try {
    //   await redis.setex(`news - ${category}`, 600, JSON.stringify(filteredArticles));
    // } catch (cacheError) {
    //   console.warn("Redis cache write failed (non-fatal):", cacheError);
    // }
    return res.status(200).json(filteredArticles);
  } catch (error) {
    return res.status(400).json(error);
  }
};

export const getTopNews = async (req: Request, res: Response) => {
  const limit = req.query.limit || 100;
  try {
    let topNews = null;
    // Redis disabled for dev (avoid burning Upstash quota) — see lib/redis.js
    // try {
    //   topNews = await redis.get("top-news");
    // } catch (cacheError) {
    //   console.warn("Redis cache read failed (non-fatal):", cacheError);
    // }
    if (topNews) {
      console.log("EXISTS IN THE CACHE");
      return res.status(200).json(topNews);
    }
    console.log("FETCHING THE NEWS");
    const response = await axios.get("https://gnews.io/api/v4/top-headlines", {
      params: {
        lang: "en",
        max: limit,
        apikey: process.env.GNEWS_API_KEY,
        category: "general",
      },
    });
    const articles = response.data.articles;
    // Redis disabled for dev (avoid burning Upstash quota) — see lib/redis.js
    // try {
    //   await redis.setex("top-news", 600, articles);
    // } catch (cacheError) {
    //   console.warn("Redis cache write failed (non-fatal):", cacheError);
    // }
    return res.status(200).json(articles);
  } catch (error) {
    return res
      .status(500)
      .json({ error: error instanceof Error ? error.message : "Something went wrong" });
  }
};
