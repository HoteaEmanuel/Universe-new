import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../database/prisma.js", () => ({
  prisma: { userPreferences: { upsert: vi.fn() } },
}));

import { prisma } from "../database/prisma.js";
import { findOrCreateUserPreferences, updateUserPreferences } from "./preferences.repository.js";

describe("preferences.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("findOrCreateUserPreferences upserts with an empty update (no-op if it already exists)", async () => {
    await findOrCreateUserPreferences("user-1");
    expect(prisma.userPreferences.upsert).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      update: {},
      create: { userId: "user-1" },
    });
  });

  it("updateUserPreferences applies the given fields on both branches", async () => {
    await updateUserPreferences("user-1", { theme: "dark" });
    expect(prisma.userPreferences.upsert).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      update: { theme: "dark" },
      create: { userId: "user-1", theme: "dark" },
    });
  });
});
