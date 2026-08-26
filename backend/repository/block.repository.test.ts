import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../database/prisma.js", () => ({
  prisma: {
    block: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from "../database/prisma.js";
import { createBlock, findBlock } from "./block.repository.js";

describe("block.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("findBlock looks up a block by the blocker/blocked composite key", async () => {
    vi.mocked(prisma.block.findUnique).mockResolvedValue({ id: "block-1" } as never);

    const result = await findBlock("user-a", "user-b");

    expect(prisma.block.findUnique).toHaveBeenCalledWith({
      where: { blockerId_blockedId: { blockerId: "user-a", blockedId: "user-b" } },
    });
    expect(result).toEqual({ id: "block-1" });
  });

  it("createBlock inserts a block row for the given pair", async () => {
    vi.mocked(prisma.block.create).mockResolvedValue({ id: "block-2" } as never);

    await createBlock("user-a", "user-b");

    expect(prisma.block.create).toHaveBeenCalledWith({
      data: { blockerId: "user-a", blockedId: "user-b" },
    });
  });
});
