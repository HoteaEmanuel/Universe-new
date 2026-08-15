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
      CLOUDFLARE_ACCESS_KEY: string;
      CLOUDFLARE_SECRET_ACCESS: string;
      CLOUDFLARE_ACCOUNT_ID: string;
      CLOUDFLARE_S3_API: string;
      CLOUDFLARE_BUCKET: string;
      CLOUDFLARE_PUBLIC_URL: string;
      GEMINI_API_KEY: string;
      GNEWS_API_KEY: string;
      PORT?: string;
    }
  }
}

export {};
