import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repository/group-members.repository.js", () => ({
  findGroupMembersByUsernames: vi.fn(),
}));

import { findGroupMembersByUsernames } from "../repository/group-members.repository.js";
import { resolveGroupMentionedUsers } from "./group-mention.service.js";

describe("resolveGroupMentionedUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scopes the username lookup to the group and excludes the author", async () => {
    vi.mocked(findGroupMembersByUsernames).mockResolvedValue([
      { id: "member-1" },
      { id: "author-1" },
    ] as never);

    const result = await resolveGroupMentionedUsers("group-1", "hey @member_one @self", "author-1");

    expect(findGroupMembersByUsernames).toHaveBeenCalledWith("group-1", ["member_one", "self"]);
    expect(result).toEqual([{ id: "member-1" }]);
  });
});
