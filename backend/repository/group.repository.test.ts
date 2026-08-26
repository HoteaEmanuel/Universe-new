import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../database/prisma.js", () => ({
  prisma: { group: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() } },
}));

import { prisma } from "../database/prisma.js";
import {
  createGroup,
  findGroupById,
  findPublicGroupsNotJoined,
  setGroupCourseTag,
} from "./group.repository.js";

describe("group.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createGroup passes the given fields through", async () => {
    await createGroup({ name: "Study Group", university: "MIT" });
    expect(prisma.group.create).toHaveBeenCalledWith({
      data: { name: "Study Group", description: undefined, visibility: undefined, university: "MIT", courseTag: undefined },
    });
  });

  it("findGroupById looks up by id", async () => {
    await findGroupById("group-1");
    expect(prisma.group.findUnique).toHaveBeenCalledWith({ where: { id: "group-1" } });
  });

  describe("findPublicGroupsNotJoined", () => {
    it("excludes already-joined groups and only returns public ones", async () => {
      await findPublicGroupsNotJoined(["group-1"]);
      expect(prisma.group.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { visibility: "public", id: { notIn: ["group-1"] } } }),
      );
    });

    it("filters by courseTag only when provided", async () => {
      await findPublicGroupsNotJoined([], "Mathematics");
      expect(prisma.group.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { visibility: "public", id: { notIn: [] }, courseTag: "Mathematics" },
        }),
      );
    });
  });

  it("setGroupCourseTag updates the course tag", async () => {
    await setGroupCourseTag("group-1", "Mathematics");
    expect(prisma.group.update).toHaveBeenCalledWith({
      where: { id: "group-1" },
      data: { courseTag: "Mathematics" },
    });
  });
});
