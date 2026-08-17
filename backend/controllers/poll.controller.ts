import type { Request, Response } from "express";
import { voteOnPoll, closePoll, getMyPollVote } from "../services/poll.service.js";
import type { VoteOnPollInput } from "../schemas/poll.schema.js";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";

export const voteOnPollController = async (req: Request, res: Response) => {
  try {
    const pollId = req.params.id as string;
    const userId = req.userId as string;
    const { optionId } = req.body as VoteOnPollInput;
    const poll = await voteOnPoll({ pollId, userId, optionId });
    return res.status(200).json({ message: "Vote recorded", poll });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const closePollController = async (req: Request, res: Response) => {
  try {
    const pollId = req.params.id as string;
    const userId = req.userId as string;
    const poll = await closePoll({ pollId, userId });
    return res.status(200).json({ message: "Poll closed", poll });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const getMyPollVoteController = async (req: Request, res: Response) => {
  try {
    const pollId = req.params.id as string;
    const userId = req.userId as string;
    const optionId = await getMyPollVote(pollId, userId);
    return res.status(200).json({ message: "Fetched vote", optionId });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};
