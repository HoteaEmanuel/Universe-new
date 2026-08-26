import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../database/prisma.js", () => ({
  prisma: {
    notification: { findMany: vi.fn(), create: vi.fn() },
    userPreferences: { findUnique: vi.fn() },
  },
}));
vi.mock("../lib/socket.js", () => ({
  io: { to: vi.fn(() => ({ emit: vi.fn() })) },
  getReceiverSocketId: vi.fn(),
}));

import { prisma } from "../database/prisma.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import {
  createGroupMessageNotification,
  createMessageNotification,
  createNotification,
  emitNewNotification,
  getNotificationsPage,
} from "./notification.repository.js";

describe("notification.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getNotificationsPage paginates with a lookahead row", async () => {
    vi.mocked(prisma.notification.findMany).mockResolvedValue([{ id: "1" }, { id: "2" }] as never);
    const page = await getNotificationsPage("user-1", undefined, 1);
    expect(page).toEqual({ notifications: [{ id: "1" }], nextCursor: "1", hasMore: true });
  });

  it("createNotification stores the type-specific fields (post/comment)", async () => {
    await createNotification({
      userId: "user-1",
      actionUserId: "user-2",
      type: "post-like",
      postId: "post-1",
    });
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ postId: "post-1", type: "post-like" }) }),
    );
  });

  it("createMessageNotification stores conversationId", async () => {
    await createMessageNotification({
      userId: "user-1",
      actionUserId: "user-2",
      type: "message",
      conversationId: "convo-1",
    });
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ conversationId: "convo-1" }) }),
    );
  });

  it("createGroupMessageNotification stores groupId", async () => {
    await createGroupMessageNotification({
      userId: "user-1",
      actionUserId: "user-2",
      type: "group-message",
      groupId: "group-1",
    });
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ groupId: "group-1" }) }),
    );
  });

  describe("emitNewNotification", () => {
    it("does not emit when the user disabled real-time notifications", async () => {
      vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue({ notificationsEnabled: false } as never);
      await emitNewNotification("user-1", { id: "notif-1" });
      expect(io.to).not.toHaveBeenCalled();
    });

    it("emits when the user has no preference row (defaults to enabled)", async () => {
      vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue(null);
      vi.mocked(getReceiverSocketId).mockReturnValue("socket-1");
      await emitNewNotification("user-1", { id: "notif-1" });
      expect(io.to).toHaveBeenCalledWith("socket-1");
    });

    it("does not emit when the user has no active socket connection", async () => {
      vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue({ notificationsEnabled: true } as never);
      vi.mocked(getReceiverSocketId).mockReturnValue(undefined);
      await emitNewNotification("user-1", { id: "notif-1" });
      expect(io.to).not.toHaveBeenCalled();
    });
  });
});
