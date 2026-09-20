import type { PollStatus } from "./domain.js";

// Was defined verbatim in both frontend/src/queryAndMutation/types.ts and
// frontend/src/features/chat/types.ts — one definition now.

export type PollOption = {
  id: string;
  text: string;
  position: number;
  voteCount: number;
};

export type Poll = {
  id: string;
  question: string;
  authorId: string;
  closesAt?: string | null;
  closedAt?: string | null;
  status: PollStatus;
  totalVotes: number;
  options: PollOption[];
};

export type CreatePollFields = {
  question: string;
  options: string[];
  closesAt?: string;
};

export type NewPollMessagePayload = {
  question: string;
  options: string[];
  closesAt?: string;
};
