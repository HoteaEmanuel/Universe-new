import { beforeEach, describe, expect, it, vi } from "vitest";

const socketHandle = { emit: vi.fn() };

vi.mock("../repository/conversation.repository.js", () => ({
  createConversation: vi.fn(),
  findConversationsPage: vi.fn(),
  findConversationById: vi.fn(),
  findConversationByParticipants: vi.fn(),
  markConversationRead: vi.fn(),
  setConversationHiddenAt: vi.fn(),
  setConversationClearedAndHiddenAt: vi.fn(),
}));
vi.mock("../repository/message.repository.js", () => ({
  createMessage: vi.fn(),
  findMessageById: vi.fn(),
}));
vi.mock("../database/prisma.js", () => ({
  prisma: {
    conversation: { update: vi.fn() },
    message: { update: vi.fn() },
    messageReaction: { findUnique: vi.fn(), delete: vi.fn(), upsert: vi.fn() },
  },
}));
vi.mock("../lib/socket.js", () => ({
  io: { to: vi.fn(() => socketHandle) },
  getReceiverSocketId: vi.fn((id: string) => `socket-${id}`),
  getActiveConversationUsers: vi.fn(),
}));
vi.mock("../lib/storage.js", () => ({
  uploadImage: vi.fn(),
  deleteImages: vi.fn(),
}));
vi.mock("../repository/notification.repository.js", () => ({
  createMessageNotification: vi.fn(),
  emitNewNotification: vi.fn(),
}));
vi.mock("../repository/user.repository.js", () => ({
  findUserById: vi.fn(),
}));
vi.mock("../repository/post.repository.js", () => ({
  findPostById: vi.fn(),
}));
vi.mock("./block.service.js", () => ({
  assertCanMessage: vi.fn(),
  isBlockedEitherWay: vi.fn(),
  MessageNotAllowedError: class MessageNotAllowedError extends Error {},
}));

import { prisma } from "../database/prisma.js";
import { getActiveConversationUsers, io } from "../lib/socket.js";
import { deleteImages, uploadImage } from "../lib/storage.js";
import {
  createConversation,
  findConversationByParticipants,
  findConversationById,
  markConversationRead as markConversationReadRepo,
  setConversationClearedAndHiddenAt,
  setConversationHiddenAt,
} from "../repository/conversation.repository.js";
import { createMessage, findMessageById } from "../repository/message.repository.js";
import {
  createMessageNotification,
  emitNewNotification,
} from "../repository/notification.repository.js";
import { findPostById } from "../repository/post.repository.js";
import { findUserById } from "../repository/user.repository.js";
import { assertCanMessage, isBlockedEitherWay } from "./block.service.js";
import {
  archiveConversation,
  deleteConversationForMe,
  deleteMessage,
  markConversationRead,
  sendFilesMessage,
  sendMessage,
  sendVoiceMessage,
  setMessageReaction,
  sharePostToUsers,
  startConversation,
  unarchiveConversation,
} from "./conversation.service.js";

describe("conversation.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(findUserById).mockResolvedValue({ id: "user-1", firstName: "Jane" } as never);
    vi.mocked(getActiveConversationUsers).mockReturnValue(undefined);
    vi.mocked(createMessageNotification).mockResolvedValue({ id: "notif-1" } as never);
    vi.mocked(assertCanMessage).mockResolvedValue(undefined);
    vi.mocked(isBlockedEitherWay).mockResolvedValue(false);
  });

  describe("startConversation", () => {
    it("rejects an empty message", async () => {
      await expect(
        startConversation({ authUserId: "user-1", otherUserId: "user-2", messageData: "" }),
      ).rejects.toThrow("No message");
    });

    it("rejects when either party has blocked the other", async () => {
      vi.mocked(assertCanMessage).mockRejectedValue(new Error("blocked"));
      await expect(
        startConversation({ authUserId: "user-1", otherUserId: "user-2", messageData: "hi" }),
      ).rejects.toThrow("blocked");
      expect(createConversation).not.toHaveBeenCalled();
    });

    it("rejects starting a second conversation with the same person", async () => {
      vi.mocked(findConversationByParticipants).mockResolvedValue({ id: "convo-1" } as never);
      await expect(
        startConversation({ authUserId: "user-1", otherUserId: "user-2", messageData: "hi" }),
      ).rejects.toThrow("Conversation already exists");
    });

    it("creates the conversation, sends the first message, and emits it", async () => {
      vi.mocked(findConversationByParticipants).mockResolvedValue(null);
      vi.mocked(createConversation).mockResolvedValue({ id: "convo-1" } as never);
      vi.mocked(createMessage).mockResolvedValue({ id: "message-1" } as never);

      const convoId = await startConversation({
        authUserId: "user-1",
        otherUserId: "user-2",
        messageData: "hi",
      });

      expect(convoId).toBe("convo-1");
      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: "convo-1" },
        data: { lastMessageId: "message-1" },
      });
      expect(io.to).toHaveBeenCalledWith("socket-user-2");
      expect(socketHandle.emit).toHaveBeenCalledWith("newMesssage", { id: "message-1" });
    });
  });

  describe("sendMessage", () => {
    const conversation = { id: "convo-1", participantOneId: "user-1", participantTwoId: "user-2" };

    it("rejects for a nonexistent conversation", async () => {
      vi.mocked(findConversationById).mockResolvedValue(null);
      await expect(
        sendMessage({ convoId: "convo-1", messageText: "hi", authUserId: "user-1" }),
      ).rejects.toThrow("Conversation doesnt exist");
    });

    it("resolves the receiver as the other participant and checks the block gate", async () => {
      vi.mocked(findConversationById).mockResolvedValue(conversation as never);
      vi.mocked(createMessage).mockResolvedValue({ id: "message-1" } as never);

      await sendMessage({ convoId: "convo-1", messageText: "hi", authUserId: "user-1" });

      expect(assertCanMessage).toHaveBeenCalledWith("user-1", "user-2");
      expect(createMessage).toHaveBeenCalledWith(
        expect.objectContaining({ senderId: "user-1", receiverId: "user-2", content: "hi" }),
      );
    });

    it("notifies the receiver when they aren't actively viewing the conversation", async () => {
      vi.mocked(findConversationById).mockResolvedValue(conversation as never);
      vi.mocked(createMessage).mockResolvedValue({ id: "message-1", content: "hi" } as never);
      vi.mocked(getActiveConversationUsers).mockReturnValue(new Set());

      await sendMessage({ convoId: "convo-1", messageText: "hi", authUserId: "user-1" });

      expect(createMessageNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "user-2", conversationId: "convo-1" }),
      );
      expect(emitNewNotification).toHaveBeenCalled();
      expect(markConversationReadRepo).not.toHaveBeenCalled();
    });

    it("marks the conversation read instead of notifying when the receiver is actively viewing it", async () => {
      vi.mocked(findConversationById).mockResolvedValue(conversation as never);
      vi.mocked(createMessage).mockResolvedValue({ id: "message-1", content: "hi" } as never);
      vi.mocked(getActiveConversationUsers).mockReturnValue(new Set(["user-2"]));
      vi.mocked(markConversationReadRepo).mockResolvedValue(null);

      await sendMessage({ convoId: "convo-1", messageText: "hi", authUserId: "user-1" });

      expect(createMessageNotification).not.toHaveBeenCalled();
      expect(markConversationReadRepo).toHaveBeenCalledWith("convo-1", "user-2");
    });

    it("uploads images and passes their URLs/keys through", async () => {
      vi.mocked(findConversationById).mockResolvedValue(conversation as never);
      vi.mocked(uploadImage).mockResolvedValue({ url: "https://cdn/a.jpg", key: "key-a" });
      vi.mocked(createMessage).mockResolvedValue({ id: "message-1" } as never);
      const image = { buffer: Buffer.from(""), mimetype: "image/jpeg" } as Express.Multer.File;

      await sendMessage({ convoId: "convo-1", images: [image], authUserId: "user-1" });

      expect(createMessage).toHaveBeenCalledWith(
        expect.objectContaining({ imageUrls: ["https://cdn/a.jpg"], imagePublicIds: ["key-a"] }),
      );
    });
  });

  it("sendFilesMessage uploads each file and attaches file metadata", async () => {
    vi.mocked(findConversationById).mockResolvedValue({
      id: "convo-1",
      participantOneId: "user-1",
      participantTwoId: "user-2",
    } as never);
    vi.mocked(uploadImage).mockResolvedValue({ url: "https://cdn/f.pdf", key: "key-f" });
    vi.mocked(createMessage).mockResolvedValue({ id: "message-1" } as never);
    const file = {
      buffer: Buffer.from(""),
      mimetype: "application/pdf",
      originalname: "resume.pdf",
      size: 1234,
    } as Express.Multer.File;

    await sendFilesMessage({ convoId: "convo-1", files: [file], authUserId: "user-1" });

    expect(createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [
          { fileUrl: "https://cdn/f.pdf", fileKey: "key-f", fileName: "resume.pdf", fileSize: 1234, mimeType: "application/pdf" },
        ],
      }),
    );
  });

  it("sendVoiceMessage uploads the audio and records its duration", async () => {
    vi.mocked(findConversationById).mockResolvedValue({
      id: "convo-1",
      participantOneId: "user-1",
      participantTwoId: "user-2",
    } as never);
    vi.mocked(uploadImage).mockResolvedValue({ url: "https://cdn/audio.webm", key: "key-audio" });
    vi.mocked(createMessage).mockResolvedValue({ id: "message-1" } as never);
    const audio = { buffer: Buffer.from(""), mimetype: "audio/webm" } as Express.Multer.File;

    await sendVoiceMessage({ convoId: "convo-1", authUserId: "user-1", audio, durationSec: 12 });

    expect(createMessage).toHaveBeenCalledWith(
      expect.objectContaining({ audioUrl: "https://cdn/audio.webm", audioKey: "key-audio", audioDurationSec: 12 }),
    );
  });

  describe("sharePostToUsers", () => {
    it("rejects for a nonexistent post", async () => {
      vi.mocked(findPostById).mockResolvedValue(null);
      await expect(
        sharePostToUsers({ authUserId: "user-1", postId: "post-1", recipientIds: ["user-2"] }),
      ).rejects.toThrow("Post not found");
    });

    it("rejects when every recipient is yourself or a duplicate of yourself", async () => {
      vi.mocked(findPostById).mockResolvedValue({ id: "post-1" } as never);
      await expect(
        sharePostToUsers({ authUserId: "user-1", postId: "post-1", recipientIds: ["user-1"] }),
      ).rejects.toThrow("No recipients provided");
    });

    it("silently skips blocked recipients instead of failing the whole share", async () => {
      vi.mocked(findPostById).mockResolvedValue({ id: "post-1" } as never);
      vi.mocked(isBlockedEitherWay).mockImplementation(
        async (_a: string, recipientId: string) => recipientId === "blocked-user",
      );
      vi.mocked(findConversationByParticipants).mockResolvedValue({ id: "convo-1" } as never);
      vi.mocked(createMessage).mockResolvedValue({ id: "message-1" } as never);

      const results = await sharePostToUsers({
        authUserId: "user-1",
        postId: "post-1",
        recipientIds: ["blocked-user", "ok-user"],
      });

      expect(results).toHaveLength(1);
      expect(createMessage).toHaveBeenCalledTimes(1);
      expect(createMessage).toHaveBeenCalledWith(
        expect.objectContaining({ receiverId: "ok-user", sharedPostId: "post-1" }),
      );
    });

    it("reuses an existing conversation instead of creating a new one", async () => {
      vi.mocked(findPostById).mockResolvedValue({ id: "post-1" } as never);
      vi.mocked(isBlockedEitherWay).mockResolvedValue(false);
      vi.mocked(findConversationByParticipants).mockResolvedValue({ id: "existing-convo" } as never);
      vi.mocked(createMessage).mockResolvedValue({ id: "message-1" } as never);

      await sharePostToUsers({ authUserId: "user-1", postId: "post-1", recipientIds: ["user-2"] });

      expect(createConversation).not.toHaveBeenCalled();
    });
  });

  describe("markConversationRead", () => {
    it("returns null when there's nothing to mark read", async () => {
      vi.mocked(markConversationReadRepo).mockResolvedValue(null);
      expect(await markConversationRead({ convoId: "convo-1", userId: "user-1" })).toBeNull();
    });

    it("emits a read receipt when the pair isn't blocked", async () => {
      vi.mocked(markConversationReadRepo).mockResolvedValue({
        participantOneId: "user-1",
        participantTwoId: "user-2",
        lastReadAtParticipantOne: new Date("2026-01-01T00:00:00.000Z"),
      } as never);
      vi.mocked(isBlockedEitherWay).mockResolvedValue(false);

      await markConversationRead({ convoId: "convo-1", userId: "user-1" });

      expect(socketHandle.emit).toHaveBeenCalledWith(
        "conversationRead",
        expect.objectContaining({ convoId: "convo-1" }),
      );
    });

    it("does not emit a read receipt across a block", async () => {
      vi.mocked(markConversationReadRepo).mockResolvedValue({
        participantOneId: "user-1",
        participantTwoId: "user-2",
      } as never);
      vi.mocked(isBlockedEitherWay).mockResolvedValue(true);

      await markConversationRead({ convoId: "convo-1", userId: "user-1" });

      expect(socketHandle.emit).not.toHaveBeenCalled();
    });
  });

  it("archiveConversation/unarchiveConversation/deleteConversationForMe delegate to the repository", async () => {
    await archiveConversation({ convoId: "c1", userId: "u1" });
    expect(setConversationHiddenAt).toHaveBeenCalledWith("c1", "u1", expect.any(Date));

    await unarchiveConversation({ convoId: "c1", userId: "u1" });
    expect(setConversationHiddenAt).toHaveBeenCalledWith("c1", "u1", null);

    await deleteConversationForMe({ convoId: "c1", userId: "u1" });
    expect(setConversationClearedAndHiddenAt).toHaveBeenCalledWith("c1", "u1", expect.any(Date));
  });

  describe("deleteMessage", () => {
    it("rejects for a nonexistent message", async () => {
      vi.mocked(findMessageById).mockResolvedValue(null);
      await expect(deleteMessage({ messageId: "m1" })).rejects.toThrow("Message not found");
    });

    it("soft-deletes the message and cleans up its storage objects", async () => {
      vi.mocked(findMessageById).mockResolvedValue({
        id: "m1",
        receiverId: "user-2",
        imagePublicIds: ["img-key"],
        audioKey: "audio-key",
        attachments: [{ fileKey: "file-key" }],
      } as never);
      vi.mocked(deleteImages).mockResolvedValue(undefined as never);

      await deleteMessage({ messageId: "m1" });

      expect(prisma.message.update).toHaveBeenCalledWith({
        where: { id: "m1" },
        data: { deleted: true },
      });
      expect(deleteImages).toHaveBeenCalledWith(["img-key", "audio-key", "file-key"]);
      expect(socketHandle.emit).toHaveBeenCalledWith("messageDeleted", "m1");
    });
  });

  describe("setMessageReaction", () => {
    it("removes the reaction on a repeat of the same emoji", async () => {
      vi.mocked(findMessageById).mockResolvedValue({ id: "m1", senderId: "user-1", receiverId: "user-2" } as never);
      vi.mocked(prisma.messageReaction.findUnique).mockResolvedValue({ id: "reaction-1", emoji: "👍" } as never);

      const result = await setMessageReaction({ messageId: "m1", userId: "user-1", emoji: "👍" });

      expect(prisma.messageReaction.delete).toHaveBeenCalledWith({ where: { id: "reaction-1" } });
      expect(result).toEqual({ removed: true, messageId: "m1", userId: "user-1", emoji: "👍" });
    });

    it("upserts a new/changed reaction", async () => {
      vi.mocked(findMessageById).mockResolvedValue({ id: "m1", senderId: "user-1", receiverId: "user-2" } as never);
      vi.mocked(prisma.messageReaction.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.messageReaction.upsert).mockResolvedValue({ id: "reaction-1", emoji: "👍" } as never);

      const result = await setMessageReaction({ messageId: "m1", userId: "user-1", emoji: "👍" });

      expect(result).toEqual({ removed: false, reaction: { id: "reaction-1", emoji: "👍" } });
    });
  });
});
