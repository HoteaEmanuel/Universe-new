import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repository/poll.repository.js", () => ({
  findPollById: vi.fn(),
  findUserVoteForPoll: vi.fn(),
  castVote: vi.fn(),
  closePollRow: vi.fn(),
}));
vi.mock("../repository/group-members.repository.js", () => ({
  findGroupMember: vi.fn(),
}));
vi.mock("../database/prisma.js", () => ({
  prisma: { groupMessage: { findUnique: vi.fn() } },
}));

import { prisma } from "../database/prisma.js";
import { findGroupMember } from "../repository/group-members.repository.js";
import {
  castVote,
  closePollRow,
  findPollById,
  findUserVoteForPoll,
} from "../repository/poll.repository.js";
import { closePoll, derivePollStatus, getMyPollVote, voteOnPoll } from "./poll.service.js";

const openPoll = (overrides = {}) => ({
  id: "poll-1",
  authorId: "author-1",
  closedAt: null,
  closesAt: null,
  groupMessageId: null,
  options: [{ id: "opt-1", text: "A", position: 0, _count: { votes: 0 } }],
  ...overrides,
});

describe("derivePollStatus", () => {
  it("is closed once closedAt is set", () => {
    expect(derivePollStatus({ closedAt: new Date(), closesAt: null })).toBe("closed");
  });

  it("is closed once closesAt has passed, even without an explicit closedAt", () => {
    expect(derivePollStatus({ closedAt: null, closesAt: new Date(Date.now() - 1000) })).toBe(
      "closed",
    );
  });

  it("is open before closesAt", () => {
    expect(derivePollStatus({ closedAt: null, closesAt: new Date(Date.now() + 1000) })).toBe(
      "open",
    );
  });

  it("is open with no closedAt/closesAt at all", () => {
    expect(derivePollStatus({ closedAt: null, closesAt: null })).toBe("open");
  });
});

describe("poll.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("voteOnPoll", () => {
    it("rejects for an unknown poll", async () => {
      vi.mocked(findPollById).mockResolvedValue(null);
      await expect(voteOnPoll({ pollId: "poll-1", userId: "user-1", optionId: "opt-1" })).rejects.toThrow(
        "Poll not found",
      );
    });

    it("rejects voting on a closed poll", async () => {
      vi.mocked(findPollById).mockResolvedValue(openPoll({ closedAt: new Date() }) as never);
      await expect(voteOnPoll({ pollId: "poll-1", userId: "user-1", optionId: "opt-1" })).rejects.toThrow(
        "This poll is closed",
      );
    });

    it("rejects an option id that doesn't belong to the poll", async () => {
      vi.mocked(findPollById).mockResolvedValue(openPoll() as never);
      await expect(
        voteOnPoll({ pollId: "poll-1", userId: "user-1", optionId: "not-an-option" }),
      ).rejects.toThrow("Invalid poll option");
      expect(castVote).not.toHaveBeenCalled();
    });

    it("rejects a non-member voting on a group-message poll", async () => {
      vi.mocked(findPollById).mockResolvedValue(openPoll({ groupMessageId: "gm-1" }) as never);
      vi.mocked(prisma.groupMessage.findUnique).mockResolvedValue({ groupId: "group-1" } as never);
      vi.mocked(findGroupMember).mockResolvedValue(null);

      await expect(voteOnPoll({ pollId: "poll-1", userId: "user-1", optionId: "opt-1" })).rejects.toThrow(
        "You must be a member of this group to vote",
      );
      expect(castVote).not.toHaveBeenCalled();
    });

    it("lets a group member vote on a group-message poll", async () => {
      const poll = openPoll({ groupMessageId: "gm-1" });
      vi.mocked(findPollById).mockResolvedValueOnce(poll as never).mockResolvedValueOnce(poll as never);
      vi.mocked(prisma.groupMessage.findUnique).mockResolvedValue({ groupId: "group-1" } as never);
      vi.mocked(findGroupMember).mockResolvedValue({ role: "member" } as never);

      const result = await voteOnPoll({ pollId: "poll-1", userId: "user-1", optionId: "opt-1" });

      expect(castVote).toHaveBeenCalledWith({ pollId: "poll-1", optionId: "opt-1", userId: "user-1" });
      expect(result.id).toBe("poll-1");
    });

    it("lets anyone vote on a poll that isn't attached to a group message", async () => {
      const poll = openPoll();
      vi.mocked(findPollById).mockResolvedValueOnce(poll as never).mockResolvedValueOnce(poll as never);

      await voteOnPoll({ pollId: "poll-1", userId: "user-1", optionId: "opt-1" });

      expect(prisma.groupMessage.findUnique).not.toHaveBeenCalled();
      expect(castVote).toHaveBeenCalled();
    });
  });

  describe("closePoll", () => {
    it("rejects for an unknown poll", async () => {
      vi.mocked(findPollById).mockResolvedValue(null);
      await expect(closePoll({ pollId: "poll-1", userId: "user-1" })).rejects.toThrow(
        "Poll not found",
      );
    });

    it("rejects a non-author", async () => {
      vi.mocked(findPollById).mockResolvedValue(openPoll() as never);
      await expect(closePoll({ pollId: "poll-1", userId: "not-the-author" })).rejects.toThrow(
        "Only the poll author can close it",
      );
      expect(closePollRow).not.toHaveBeenCalled();
    });

    it("rejects closing an already-closed poll", async () => {
      vi.mocked(findPollById).mockResolvedValue(openPoll({ closedAt: new Date() }) as never);
      await expect(closePoll({ pollId: "poll-1", userId: "author-1" })).rejects.toThrow(
        "Poll is already closed",
      );
    });

    it("closes the poll when called by its author", async () => {
      const poll = openPoll();
      vi.mocked(findPollById).mockResolvedValueOnce(poll as never).mockResolvedValueOnce(
        openPoll({ closedAt: new Date() }) as never,
      );

      const result = await closePoll({ pollId: "poll-1", userId: "author-1" });

      expect(closePollRow).toHaveBeenCalledWith("poll-1");
      expect(result.status).toBe("closed");
    });
  });

  describe("getMyPollVote", () => {
    it("returns null when the user hasn't voted", async () => {
      vi.mocked(findUserVoteForPoll).mockResolvedValue(null);
      expect(await getMyPollVote("poll-1", "user-1")).toBeNull();
    });

    it("returns the voted option id", async () => {
      vi.mocked(findUserVoteForPoll).mockResolvedValue({ optionId: "opt-1" } as never);
      expect(await getMyPollVote("poll-1", "user-1")).toBe("opt-1");
    });
  });
});
