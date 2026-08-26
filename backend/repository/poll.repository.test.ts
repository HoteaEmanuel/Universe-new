import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../database/prisma.js", () => ({
  prisma: {
    poll: { findUnique: vi.fn(), update: vi.fn() },
    pollVote: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}));

import { prisma } from "../database/prisma.js";
import { castVote, closePollRow, findPollById, findUserVoteForPoll } from "./poll.repository.js";

describe("poll.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("findPollById includes ordered options with vote counts", async () => {
    await findPollById("poll-1");
    expect(prisma.poll.findUnique).toHaveBeenCalledWith({
      where: { id: "poll-1" },
      include: { options: { orderBy: { position: "asc" }, include: { _count: { select: { votes: true } } } } },
    });
  });

  it("findUserVoteForPoll looks up the composite unique key", async () => {
    await findUserVoteForPoll("poll-1", "user-1");
    expect(prisma.pollVote.findUnique).toHaveBeenCalledWith({
      where: { pollId_userId: { pollId: "poll-1", userId: "user-1" } },
    });
  });

  it("castVote upserts the user's vote, switching options on a repeat vote", async () => {
    await castVote({ pollId: "poll-1", optionId: "opt-2", userId: "user-1" });
    expect(prisma.pollVote.upsert).toHaveBeenCalledWith({
      where: { pollId_userId: { pollId: "poll-1", userId: "user-1" } },
      update: { optionId: "opt-2" },
      create: { pollId: "poll-1", optionId: "opt-2", userId: "user-1" },
    });
  });

  it("closePollRow stamps closedAt", async () => {
    await closePollRow("poll-1");
    expect(prisma.poll.update).toHaveBeenCalledWith({
      where: { id: "poll-1" },
      data: { closedAt: expect.any(Date) },
    });
  });
});
