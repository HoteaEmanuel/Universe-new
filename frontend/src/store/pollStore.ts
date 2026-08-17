import axios, { type AxiosError } from "axios";
import { create } from "zustand";
import type { Poll } from "../queryAndMutation/types";

const API_URL =
  import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000/api";
axios.defaults.withCredentials = true;

const errorMessage = (error: unknown, fallback: string) =>
  (error as AxiosError<{ message?: string }>)?.response?.data?.message ||
  fallback;

type PollStore = {
  getMyPollVote: (pollId: string) => Promise<string | null>;
  voteOnPoll: (pollId: string, optionId: string) => Promise<Poll>;
  closePoll: (pollId: string) => Promise<Poll>;
};

export const usePollStore = create<PollStore>(() => ({
  getMyPollVote: async (pollId) => {
    try {
      const response = await axios.get(`${API_URL}/polls/${pollId}/my-vote`);
      return response.data.optionId;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load your vote"));
    }
  },
  voteOnPoll: async (pollId, optionId) => {
    try {
      const response = await axios.post(`${API_URL}/polls/${pollId}/vote`, {
        optionId,
      });
      return response.data.poll;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not record your vote"));
    }
  },
  closePoll: async (pollId) => {
    try {
      const response = await axios.post(`${API_URL}/polls/${pollId}/close`);
      return response.data.poll;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not close the poll"));
    }
  },
}));
