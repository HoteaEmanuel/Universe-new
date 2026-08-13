declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      DIRECT_URL: string;
      JWT_KEY: string;
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
      GOOGLE_APP_PASSWORD: string;
      CLIENT_URL: string;
      FRONTEND_URL: string;
      BACKEND_URL_: string;
      MAILTRAP_TOKEN: string;
      UPSTASH_REDIS_REST_URL: string;
      UPSTASH_REDIS_REST_TOKEN: string;
      UPSTASH_REDIS_URL: string;
      CLOUDINARY_CLOUD_NAME: string;
      CLOUDINARY_API_KEY: string;
      CLOUDINARY_SECRET_KEY: string;
      GEMINI_API_KEY: string;
      GNEWS_API_KEY: string;
      PORT?: string;
    }
  }
}

export {};
