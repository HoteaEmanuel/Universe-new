import {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "../mail-service/sendMail.js";
// BullMQ/Redis stays disabled (avoid burning Upstash's free quota — see
// lib/redisConnections.js) — at this app's scale, sending inline is simpler
// than standing up a worker process, and callers already treat this as
// fire-and-forget.
export const verifyEmailQueue = {
  add: async (_name, data) => sendEmail(data.to, data.body),
};
export const welcomeEmailQueue = {
  add: async (_name, data) => sendWelcomeEmail(data),
};
export const resetPasswordEmailQueue = {
  add: async (_name, data) => sendPasswordResetEmail(data),
};
