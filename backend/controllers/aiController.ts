import type { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

// GoogleGenerativeAI's constructor requires a string apiKey and throws
// synchronously if missing, which would crash the whole server on boot.
// Skip creating the client when it isn't configured, so the rest of the app
// still works, same pattern as passport.ts's Google OAuth guard.
let genAI: GoogleGenerativeAI | undefined;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
  console.warn("GEMINI_API_KEY not set - AI hashtag generation is disabled.");
}

export const generateHashtags = async (req: Request, res: Response) => {
  const { postContent } = req.body;
  if (!genAI) {
    return res.status(500).json({ error: "AI hashtag generation is not configured" });
  }
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `Genereaza exact 5 hashtag-uri relevante pentru aceasta postare pentru o retea sociala. Raspunde DOAR cu hashtag-uri separate prin spatii.Generezi doar cuvinte fara simboluri.

Continutul postarii: "${postContent}"

Hashtags:`;

    const result = await model.generateContent(prompt);

    const response = result.response;
    const text = response.text();

    return res.status(200).json({
      hashtags: text.length > 0 ? text.split(" ") : ["social", "post", "share"],
    });
  } catch (error) {
    console.error("Google Generative AI Error:", error);
    return res.status(500).json({
      error: "Error in hashtags generator",
      details: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

export const listModels = async (req: Request, res: Response) => {
  if (!genAI) {
    return res.status(500).json({ error: "AI hashtag generation is not configured" });
  }
  try {
    // Pre-existing bug, not introduced here: @google/generative-ai@0.24.1's
    // GoogleGenerativeAI class has no listModels() method (confirmed against
    // its .d.ts) - this call has always thrown at runtime. Cast preserves
    // that exact pre-existing behavior instead of guessing at a fix.
    const models = await (genAI as unknown as { listModels: () => Promise<{ name: string }[]> }).listModels();
    return res.status(200).json({
      models: models.map((m) => m.name),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: error instanceof Error ? error.message : "Something went wrong" });
  }
};
