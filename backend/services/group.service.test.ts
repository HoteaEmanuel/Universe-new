import { beforeEach, describe, expect, it, vi } from "vitest";

const socketHandle = { emit: vi.fn() };

vi.mock("../repository/group-members.repository.js", async () => {
  const actual = await vi.importActual<typeof import("../repository/group-members.repository.js")>(
    "../repository/group-members.repository.js",
  );
  return {
    GroupBannedError: actual.GroupBannedError,
    createGroupMember: vi.fn(),
    acquireGroupMember: vi.fn(),
    findGroupMember: vi.fn(),
    findGroupMembers: vi.fn(),
    searchGroupMembersByUsername: vi.fn(),
    findGroupMembershipsForUser: vi.fn(),
    banGroupMember: vi.fn(),
    deleteGroupBan: vi.fn(),
    findGroupBansPage: vi.fn(),
  };
});
vi.mock("../repository/group.repository.js", () => ({
  createGroup: vi.fn(),
  findGroupById: vi.fn(),
  findPublicGroupsNotJoined: vi.fn(),
  setGroupCourseTag: vi.fn(),
}));
vi.mock("../repository/message.repository.js", () => ({
  createGroupMessage: vi.fn(),
  findGroupMessageById: vi.fn(),
}));
vi.mock("../repository/notification.repository.js", () => ({
  createGroupMessageNotification: vi.fn(),
  emitNewNotification: vi.fn(),
}));
vi.mock("../repository/user.repository.js", () => ({
  findUserById: vi.fn(),
}));
vi.mock("../repository/post.repository.js", () => ({
  findPostById: vi.fn(),
}));
vi.mock("../database/prisma.js", () => ({
  prisma: {
    group: { update: vi.fn() },
    groupMessage: { update: vi.fn() },
    groupMessageReaction: { findUnique: vi.fn(), delete: vi.fn(), upsert: vi.fn() },
    groupMembers: { update: vi.fn() },
  },
}));
vi.mock("../lib/storage.js", () => ({
  uploadImage: vi.fn(),
  deleteImages: vi.fn(),
}));
vi.mock("../lib/socket.js", () => ({
  io: { to: vi.fn(() => socketHandle) },
  getReceiverSocketId: vi.fn((id: string) => `socket-${id}`),
}));
vi.mock("./group-mention.service.js", () => ({
  resolveGroupMentionedUsers: vi.fn(),
}));

import { prisma } from "../database/prisma.js";
import { deleteImages, uploadImage } from "../lib/storage.js";
import {
  acquireGroupMember,
  banGroupMember,
  createGroupMember,
  findGroupBansPage,
  findGroupMember,
  findGroupMembers,
  findGroupMembershipsForUser,
} from "../repository/group-members.repository.js";
import {
  createGroup,
  findGroupById,
  findPublicGroupsNotJoined,
  setGroupCourseTag,
} from "../repository/group.repository.js";
import { createGroupMessage, findGroupMessageById } from "../repository/message.repository.js";
import {
  createGroupMessageNotification,
  emitNewNotification,
} from "../repository/notification.repository.js";
import { findPostById } from "../repository/post.repository.js";
import { findUserById } from "../repository/user.repository.js";
import { resolveGroupMentionedUsers } from "./group-mention.service.js";
import {
  addMemberToGroup,
  banGroupMemberService,
  createGroupService,
  deleteMessage,
  editMessage,
  getCourseCatalogForUser,
  getDiscoverablePublicGroups,
  giveAdminRole,
  sendFilesMessage,
  sendMessage,
  sendPollMessage,
  sendVoiceMessage,
  setGroupCourseTagService,
  setGroupMessageReaction,
  sharePostToGroups,
  updateGroupImage,
} from "./group.service.js";

const UNI = "Colegiul National Vasile Lucaciu";

describe("group.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolveGroupMentionedUsers).mockResolvedValue([]);
    vi.mocked(findUserById).mockResolvedValue({ id: "user-1", firstName: "Jane" } as never);
    vi.mocked(findGroupMembers).mockResolvedValue([]);
    vi.mocked(createGroupMessageNotification).mockResolvedValue({ id: "notif-1" } as never);
  });

  describe("createGroupService", () => {
    it("makes the creator an admin", async () => {
      vi.mocked(findUserById).mockResolvedValue({ id: "user-1", university: null } as never);
      vi.mocked(createGroup).mockResolvedValue({ id: "group-1" } as never);

      await createGroupService({ name: "Study Group", userId: "user-1" });

      expect(createGroupMember).toHaveBeenCalledWith({ userId: "user-1", groupId: "group-1", role: "admin" });
    });

    it("rejects a course tag not offered by the creator's university", async () => {
      vi.mocked(findUserById).mockResolvedValue({ id: "user-1", university: UNI } as never);

      await expect(
        createGroupService({ name: "G", userId: "user-1", courseTag: "Astrophysics" }),
      ).rejects.toThrow("Selected course is not available for your university");
      expect(createGroup).not.toHaveBeenCalled();
    });

    it("accepts a course tag the university actually offers", async () => {
      vi.mocked(findUserById).mockResolvedValue({ id: "user-1", university: UNI } as never);
      vi.mocked(createGroup).mockResolvedValue({ id: "group-1" } as never);

      await createGroupService({ name: "G", userId: "user-1", courseTag: "Mathematics" });

      expect(createGroup).toHaveBeenCalledWith(expect.objectContaining({ courseTag: "Mathematics" }));
    });
  });

  describe("setGroupCourseTagService", () => {
    it("rejects a course not offered by the group's university", async () => {
      vi.mocked(findGroupById).mockResolvedValue({ university: UNI } as never);
      await expect(
        setGroupCourseTagService({ groupId: "group-1", courseTag: "Astrophysics" }),
      ).rejects.toThrow("Selected course is not available for this group's university");
      expect(setGroupCourseTag).not.toHaveBeenCalled();
    });

    it("clearing the course tag (null) skips validation entirely", async () => {
      await setGroupCourseTagService({ groupId: "group-1", courseTag: null });
      expect(setGroupCourseTag).toHaveBeenCalledWith("group-1", null);
    });
  });

  describe("addMemberToGroup", () => {
    it("lets a user self-join a public group", async () => {
      vi.mocked(findGroupById).mockResolvedValue({ visibility: "public" } as never);
      vi.mocked(findGroupMember).mockResolvedValue(null);

      await addMemberToGroup({ groupId: "group-1", userId: "user-1", requesterId: "user-1" });

      expect(acquireGroupMember).toHaveBeenCalledWith({ groupId: "group-1", userId: "user-1", role: "member" });
    });

    it("rejects self-joining a private group", async () => {
      vi.mocked(findGroupById).mockResolvedValue({ visibility: "private" } as never);

      await expect(
        addMemberToGroup({ groupId: "group-1", userId: "user-1", requesterId: "user-1" }),
      ).rejects.toThrow("This group is private. Ask an admin to add you.");
    });

    it("rejects a non-admin adding someone else", async () => {
      vi.mocked(findGroupMember).mockResolvedValue({ role: "member" } as never);

      await expect(
        addMemberToGroup({ groupId: "group-1", userId: "user-2", requesterId: "user-1" }),
      ).rejects.toThrow("Only group admins can add members");
    });

    it("rejects adding an existing member twice", async () => {
      vi.mocked(findGroupMember)
        .mockResolvedValueOnce({ role: "admin" } as never) // requester check
        .mockResolvedValueOnce({ role: "member" } as never); // existing-member check

      await expect(
        addMemberToGroup({ groupId: "group-1", userId: "user-2", requesterId: "user-1" }),
      ).rejects.toThrow("User is already a member of this group");
    });
  });

  describe("banGroupMemberService", () => {
    it("refuses to ban an admin", async () => {
      vi.mocked(findGroupMember).mockResolvedValue({ role: "admin" } as never);
      await expect(
        banGroupMemberService("group-1", "target-1", "banner-1", undefined),
      ).rejects.toThrow("Group admins can't be banned - demote them first");
      expect(banGroupMember).not.toHaveBeenCalled();
    });

    it("bans a non-admin and notifies them", async () => {
      vi.mocked(findGroupMember).mockResolvedValue({ role: "member" } as never);
      vi.mocked(banGroupMember).mockResolvedValue({ id: "ban-1" } as never);
      vi.mocked(findGroupById).mockResolvedValue({ name: "Study Group" } as never);

      const result = await banGroupMemberService("group-1", "target-1", "banner-1", "spam");

      expect(result).toEqual({ id: "ban-1" });
      expect(emitNewNotification).toHaveBeenCalledWith("target-1", { id: "notif-1" });
    });
  });

  it("getDiscoverablePublicGroups excludes groups the user already joined", async () => {
    vi.mocked(findGroupMembershipsForUser).mockResolvedValue([
      { groupId: "joined-1" },
      { groupId: "joined-2" },
    ] as never);
    vi.mocked(findPublicGroupsNotJoined).mockResolvedValue([{ id: "discoverable-1" }] as never);

    const result = await getDiscoverablePublicGroups("user-1", "Mathematics");

    expect(findPublicGroupsNotJoined).toHaveBeenCalledWith(
      ["joined-1", "joined-2"],
      "Mathematics",
      undefined,
      undefined,
    );
    expect(result).toEqual([{ id: "discoverable-1" }]);
  });

  it("getDiscoverablePublicGroups scopes to the viewer's university when universityOnly is set", async () => {
    vi.mocked(findGroupMembershipsForUser).mockResolvedValue([]);
    vi.mocked(findUserById).mockResolvedValue({ university: UNI } as never);
    vi.mocked(findPublicGroupsNotJoined).mockResolvedValue([{ id: "discoverable-1" }] as never);

    const result = await getDiscoverablePublicGroups("user-1", undefined, true, 4);

    expect(findPublicGroupsNotJoined).toHaveBeenCalledWith([], undefined, UNI, 4);
    expect(result).toEqual([{ id: "discoverable-1" }]);
  });

  it("getDiscoverablePublicGroups returns nothing for universityOnly when the viewer has no real university", async () => {
    vi.mocked(findGroupMembershipsForUser).mockResolvedValue([]);
    vi.mocked(findUserById).mockResolvedValue({ university: "No university yet" } as never);

    const result = await getDiscoverablePublicGroups("user-1", undefined, true, 4);

    expect(findPublicGroupsNotJoined).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  describe("getCourseCatalogForUser", () => {
    it("uses the group's university when a groupId is given", async () => {
      vi.mocked(findGroupById).mockResolvedValue({ university: UNI } as never);
      const courses = await getCourseCatalogForUser("user-1", "group-1");
      expect(courses).toContain("Mathematics");
    });

    it("falls back to the user's own university with no groupId", async () => {
      vi.mocked(findUserById).mockResolvedValue({ university: UNI } as never);
      const courses = await getCourseCatalogForUser("user-1");
      expect(courses).toContain("Mathematics");
    });

    it("returns an empty list for an unknown/no university", async () => {
      vi.mocked(findUserById).mockResolvedValue({ university: null } as never);
      expect(await getCourseCatalogForUser("user-1")).toEqual([]);
    });
  });

  describe("sendMessage (group broadcast pattern, shared by all send* variants)", () => {
    it("rejects for a nonexistent group", async () => {
      vi.mocked(findGroupById).mockResolvedValue(null);
      await expect(
        sendMessage({ groupId: "group-1", authUserId: "user-1", messageText: "hi" }),
      ).rejects.toThrow("Group doesnt exist");
    });

    it("broadcasts the message to every member over sockets", async () => {
      vi.mocked(findGroupById).mockResolvedValue({ id: "group-1", name: "Study Group" } as never);
      vi.mocked(createGroupMessage).mockResolvedValue({ id: "gm-1", content: "hi" } as never);
      vi.mocked(findGroupMembers).mockResolvedValue([
        { memberId: "user-1" },
        { memberId: "user-2" },
      ] as never);

      await sendMessage({ groupId: "group-1", authUserId: "user-1", messageText: "hi" });

      expect(socketHandle.emit).toHaveBeenCalledWith("newGroupMessage", { id: "gm-1", content: "hi" });
      expect(socketHandle.emit).toHaveBeenCalledTimes(2);
    });

    it("notifies every member except the sender", async () => {
      vi.mocked(findGroupById).mockResolvedValue({ id: "group-1", name: "Study Group" } as never);
      vi.mocked(createGroupMessage).mockResolvedValue({ id: "gm-1", content: "hi" } as never);
      vi.mocked(findGroupMembers).mockResolvedValue([
        { memberId: "user-1" },
        { memberId: "user-2" },
      ] as never);

      await sendMessage({ groupId: "group-1", authUserId: "user-1", messageText: "hi" });

      expect(createGroupMessageNotification).toHaveBeenCalledTimes(1);
      expect(createGroupMessageNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "user-2" }),
      );
    });

    it("updates the group's lastMessageId", async () => {
      vi.mocked(findGroupById).mockResolvedValue({ id: "group-1", name: "Study Group" } as never);
      vi.mocked(createGroupMessage).mockResolvedValue({ id: "gm-1" } as never);

      await sendMessage({ groupId: "group-1", authUserId: "user-1", messageText: "hi" });

      expect(prisma.group.update).toHaveBeenCalledWith({
        where: { id: "group-1" },
        data: { lastMessageId: "gm-1" },
      });
    });

    it("uploads images when provided", async () => {
      vi.mocked(findGroupById).mockResolvedValue({ id: "group-1", name: "Study Group" } as never);
      vi.mocked(uploadImage).mockResolvedValue({ url: "https://cdn/a.jpg", key: "key-a" });
      vi.mocked(createGroupMessage).mockResolvedValue({ id: "gm-1" } as never);
      const image = { buffer: Buffer.from(""), mimetype: "image/jpeg" } as Express.Multer.File;

      await sendMessage({ groupId: "group-1", authUserId: "user-1", images: [image] });

      expect(createGroupMessage).toHaveBeenCalledWith(
        expect.objectContaining({ imageUrls: ["https://cdn/a.jpg"], imagePublicIds: ["key-a"] }),
      );
    });
  });

  it("sendFilesMessage attaches uploaded file metadata", async () => {
    vi.mocked(findGroupById).mockResolvedValue({ id: "group-1", name: "Study Group" } as never);
    vi.mocked(uploadImage).mockResolvedValue({ url: "https://cdn/f.pdf", key: "key-f" });
    vi.mocked(createGroupMessage).mockResolvedValue({ id: "gm-1" } as never);
    const file = {
      buffer: Buffer.from(""),
      mimetype: "application/pdf",
      originalname: "notes.pdf",
      size: 99,
    } as Express.Multer.File;

    await sendFilesMessage({ groupId: "group-1", authUserId: "user-1", files: [file] });

    expect(createGroupMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [{ fileUrl: "https://cdn/f.pdf", fileKey: "key-f", fileName: "notes.pdf", fileSize: 99, mimeType: "application/pdf" }],
      }),
    );
  });

  it("sendVoiceMessage records audio fields and duration", async () => {
    vi.mocked(findGroupById).mockResolvedValue({ id: "group-1", name: "Study Group" } as never);
    vi.mocked(uploadImage).mockResolvedValue({ url: "https://cdn/a.webm", key: "key-a" });
    vi.mocked(createGroupMessage).mockResolvedValue({ id: "gm-1" } as never);
    const audio = { buffer: Buffer.from(""), mimetype: "audio/webm" } as Express.Multer.File;

    await sendVoiceMessage({ groupId: "group-1", authUserId: "user-1", audio, durationSec: 9 });

    expect(createGroupMessage).toHaveBeenCalledWith(
      expect.objectContaining({ audioUrl: "https://cdn/a.webm", audioKey: "key-a", audioDurationSec: 9 }),
    );
  });

  it("sendPollMessage nests the poll payload", async () => {
    vi.mocked(findGroupById).mockResolvedValue({ id: "group-1", name: "Study Group" } as never);
    vi.mocked(createGroupMessage).mockResolvedValue({ id: "gm-1" } as never);

    await sendPollMessage({ groupId: "group-1", authUserId: "user-1", question: "Q?", options: ["A", "B"] });

    expect(createGroupMessage).toHaveBeenCalledWith(
      expect.objectContaining({ poll: expect.objectContaining({ question: "Q?", options: ["A", "B"] }) }),
    );
  });

  describe("sharePostToGroups", () => {
    it("rejects for a nonexistent post", async () => {
      vi.mocked(findPostById).mockResolvedValue(null);
      await expect(
        sharePostToGroups({ authUserId: "user-1", postId: "post-1", groupIds: ["group-1"] }),
      ).rejects.toThrow("Post not found");
    });

    it("rejects with no groups provided", async () => {
      vi.mocked(findPostById).mockResolvedValue({ id: "post-1" } as never);
      await expect(
        sharePostToGroups({ authUserId: "user-1", postId: "post-1", groupIds: [] }),
      ).rejects.toThrow("No groups provided");
    });

    it("rejects sharing to a group you aren't a member of", async () => {
      vi.mocked(findPostById).mockResolvedValue({ id: "post-1" } as never);
      vi.mocked(findGroupMember).mockResolvedValue(null);

      await expect(
        sharePostToGroups({ authUserId: "user-1", postId: "post-1", groupIds: ["group-1"] }),
      ).rejects.toThrow("You are not a member of this group");
    });

    it("shares to each group once membership is confirmed", async () => {
      vi.mocked(findPostById).mockResolvedValue({ id: "post-1" } as never);
      vi.mocked(findGroupMember).mockResolvedValue({ role: "member" } as never);
      vi.mocked(findGroupById).mockResolvedValue({ id: "group-1", name: "Study Group" } as never);
      vi.mocked(createGroupMessage).mockResolvedValue({ id: "gm-1" } as never);

      const results = await sharePostToGroups({
        authUserId: "user-1",
        postId: "post-1",
        groupIds: ["group-1", "group-1"], // duplicate, should dedupe
      });

      expect(results).toHaveLength(1);
      expect(createGroupMessage).toHaveBeenCalledTimes(1);
      expect(createGroupMessage).toHaveBeenCalledWith(
        expect.objectContaining({ sharedPostId: "post-1" }),
      );
    });
  });

  describe("editMessage / deleteMessage", () => {
    it("editMessage rejects for a nonexistent message", async () => {
      vi.mocked(findGroupMessageById).mockResolvedValue(null);
      await expect(editMessage({ messageId: "m1", content: "new" })).rejects.toThrow(
        "Message not found",
      );
    });

    it("editMessage broadcasts the update to every group member", async () => {
      vi.mocked(findGroupMessageById).mockResolvedValue({ id: "m1", groupId: "group-1" } as never);
      vi.mocked(prisma.groupMessage.update).mockResolvedValue({ id: "m1", content: "new" } as never);
      vi.mocked(findGroupMembers).mockResolvedValue([{ memberId: "user-2" }] as never);

      await editMessage({ messageId: "m1", content: "new" });

      expect(socketHandle.emit).toHaveBeenCalledWith("messageEdited", { id: "m1", content: "new" });
    });

    it("deleteMessage cleans up storage objects and notifies members", async () => {
      vi.mocked(findGroupMessageById).mockResolvedValue({
        id: "m1",
        groupId: "group-1",
        imagePublicIds: ["img-1"],
        audioKey: null,
        attachments: [],
      } as never);
      vi.mocked(deleteImages).mockResolvedValue(undefined as never);
      vi.mocked(findGroupMembers).mockResolvedValue([{ memberId: "user-2" }] as never);

      await deleteMessage({ messageId: "m1" });

      expect(prisma.groupMessage.update).toHaveBeenCalledWith({
        where: { id: "m1" },
        data: { deleted: true },
      });
      expect(deleteImages).toHaveBeenCalledWith(["img-1"]);
      expect(socketHandle.emit).toHaveBeenCalledWith(
        "messageDeleted",
        expect.objectContaining({ messageId: "m1" }),
      );
    });
  });

  describe("setGroupMessageReaction", () => {
    it("removes a repeated reaction and notifies members", async () => {
      vi.mocked(findGroupMessageById).mockResolvedValue({ id: "m1", groupId: "group-1" } as never);
      vi.mocked(prisma.groupMessageReaction.findUnique).mockResolvedValue({ id: "r1", emoji: "👍" } as never);
      vi.mocked(findGroupMembers).mockResolvedValue([{ memberId: "user-2" }] as never);

      const result = await setGroupMessageReaction({ messageId: "m1", userId: "user-1", emoji: "👍" });

      expect(prisma.groupMessageReaction.delete).toHaveBeenCalledWith({ where: { id: "r1" } });
      expect(result.removed).toBe(true);
    });

    it("upserts a new reaction and notifies members", async () => {
      vi.mocked(findGroupMessageById).mockResolvedValue({ id: "m1", groupId: "group-1" } as never);
      vi.mocked(prisma.groupMessageReaction.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.groupMessageReaction.upsert).mockResolvedValue({ id: "r1", emoji: "👍" } as never);
      vi.mocked(findGroupMembers).mockResolvedValue([{ memberId: "user-2" }] as never);

      const result = await setGroupMessageReaction({ messageId: "m1", userId: "user-1", emoji: "👍" });

      expect(result.removed).toBe(false);
    });
  });

  describe("updateGroupImage", () => {
    it("rejects for a nonexistent group", async () => {
      vi.mocked(findGroupById).mockResolvedValue(null);
      await expect(updateGroupImage({ groupId: "group-1" })).rejects.toThrow("Group not found");
    });

    it("uploads a new cover and deletes the previous one", async () => {
      vi.mocked(findGroupById).mockResolvedValue({ coverImageUrl: "old-url", coverImagePublicId: "old-key" } as never);
      vi.mocked(uploadImage).mockResolvedValue({ url: "new-url", key: "new-key" });
      vi.mocked(deleteImages).mockResolvedValue(undefined as never);
      const image = { buffer: Buffer.from(""), mimetype: "image/jpeg" } as Express.Multer.File;

      await updateGroupImage({ groupId: "group-1", image });

      expect(prisma.group.update).toHaveBeenCalledWith({
        where: { id: "group-1" },
        data: { coverImageUrl: "new-url", coverImagePublicId: "new-key" },
      });
      expect(deleteImages).toHaveBeenCalledWith(["old-key"]);
    });

    it("keeps the existing cover when no new image is uploaded", async () => {
      vi.mocked(findGroupById).mockResolvedValue({ coverImageUrl: "old-url", coverImagePublicId: "old-key" } as never);

      await updateGroupImage({ groupId: "group-1" });

      expect(prisma.group.update).toHaveBeenCalledWith({
        where: { id: "group-1" },
        data: { coverImageUrl: "old-url", coverImagePublicId: "old-key" },
      });
      expect(deleteImages).not.toHaveBeenCalled();
    });
  });

  describe("giveAdminRole", () => {
    it("rejects for a non-member", async () => {
      vi.mocked(findGroupMember).mockResolvedValue(null);
      await expect(giveAdminRole({ groupId: "group-1", memberId: "user-1" })).rejects.toThrow(
        "Member not found in group",
      );
    });

    it("promotes an existing member", async () => {
      vi.mocked(findGroupMember).mockResolvedValue({ role: "member" } as never);
      await giveAdminRole({ groupId: "group-1", memberId: "user-1" });
      expect(prisma.groupMembers.update).toHaveBeenCalledWith({
        where: { groupId_memberId: { groupId: "group-1", memberId: "user-1" } },
        data: { role: "admin" },
      });
    });
  });
});
