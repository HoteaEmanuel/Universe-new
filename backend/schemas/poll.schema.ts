import { z } from "zod";

export const pollQuestionSchema = z
  .string()
  .min(1, "Add a poll question")
  .max(200, "Poll question should have less than 200 characters");

export const pollOptionTextSchema = z
  .string()
  .min(1, "Option cannot be empty")
  .max(80, "Option should have less than 80 characters");

export const pollOptionsSchema = z
  .array(pollOptionTextSchema)
  .min(2, "A poll needs at least 2 options")
  .max(6, "A poll can have at most 6 options");

export const sendGroupPollMessageSchema = z.object({
  question: pollQuestionSchema,
  options: pollOptionsSchema,
  closesAt: z.coerce.date().optional(),
});
export type SendGroupPollMessageInput = z.infer<typeof sendGroupPollMessageSchema>;

export const voteOnPollSchema = z.object({
  optionId: z.string().min(1, "optionId is required").uuid("optionId must be a valid id"),
});
export type VoteOnPollInput = z.infer<typeof voteOnPollSchema>;
