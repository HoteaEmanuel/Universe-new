// Redis disabled for dev (avoid burning Upstash quota) — see backend/queues/emailQueue.js
// import { Redis } from "ioredis";
// console.log("REDIS URL :" + process.env.UPSTASH_REDIS_URL);
// export const redisConnection = new Redis(process.env.UPSTASH_REDIS_URL, {
//   tls: {
//     rejectUnauthorized: false,
//   },
//   maxRetriesPerRequest: null,
//   enableReadyCheck: false,
//   enableOfflineQueue: false,
// });
