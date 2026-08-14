// import { Worker, Queue } from "bullmq";
// import {
//   sendEmail,
//   sendPasswordResetEmail,
//   sendWelcomeEmail,
// } from "../mail-service/sendMail.js";
// Redis disabled for dev (avoid burning Upstash quota) — see lib/redisConnections.js
// import { redisConnection } from "../lib/redisConnections.js";
// export const verifyEmailQueue = new Queue("verify-emails", {
//   connection: redisConnection,
// });

// export const welcomeEmailQueue = new Queue("welcome-emails", {
//   connection: redisConnection,
// });

// export const resetPasswordEmailQueue = new Queue("reset-password", {
//   connection: redisConnection,
// });

const noopQueue = { add: async (_name, _data) => {} };
export const verifyEmailQueue = noopQueue;
export const welcomeEmailQueue = noopQueue;
export const resetPasswordEmailQueue = noopQueue;

// const welcomeEmailWorker = new Worker(
//   "welcome-emails",
//   async (job) => {
//     console.log("Processing email job:", job.id);

//     // Send welcoming email
//     await sendWelcomeEmail(job.data);

//     return { success: true };
//   },
//   {
//     connection: redisConnection.duplicate(),
//   },
// );

// const verifyEmailWorker = new Worker(
//   "verify-emails",
//   async (job) => {
//     console.log("Processing email job:", job.id);

//     const { to, body } = job.data;
//     console.log("TO: " + to + " VERIFICATION CODE :" + body);

//     // Send verification email
//     await sendEmail(to, body);

//     console.log("Email sent to:", to);

//     return { success: true, emailSent: to };
//   },
//   {
//     connection: redisConnection.duplicate(),
//   },
// );

// const resetPassEmailWorker = new Worker(
//   "reset-password",
//   async (job) => {
//     console.log("Processing email job:", job.id);

//     // Send welcoming email
//     await sendPasswordResetEmail(job.data);

//     return { success: true };
//   },
//   {
//     connection: redisConnection.duplicate(),
//   },
// );

// verifyEmailWorker.on("completed", (job) => {
//   console.log(`Job ${job.id} completed!`);
// });

// verifyEmailWorker.on("failed", (job, err) => {
//   console.error(`Job ${job.id} failed:`, err);
// });

// welcomeEmailWorker.on("completed", (job) => {
//   console.log(`Job ${job.id} completed!`);
// });

// welcomeEmailWorker.on("failed", (job, err) => {
//   console.error(`Job ${job.id} failed:`, err);
// });

// resetPassEmailWorker.on("completed", (job) => {
//   console.log(`Job ${job.id} completed!`);
// });

// resetPassEmailWorker.on("failed", (job, err) => {
//   console.error(`Job ${job.id} failed:`, err);
// });
