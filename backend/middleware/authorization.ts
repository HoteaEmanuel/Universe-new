import type { Request, Response, NextFunction } from "express";
import { prisma } from "../database/prisma.js";
import { findPostById } from "../repository/post.repository.js";
import { findConversationById } from "../repository/conversation.repository.js";
import {
  findMessageById,
  findGroupMessageById,
} from "../repository/message.repository.js";
import { findGroupMember } from "../repository/group-members.repository.js";
import { findEventById } from "../repository/event.repository.js";

interface AuthorizationOptions<T> {
  getResource: (req: Request) => Promise<T | null | undefined>;
  authorize: (resource: T, req: Request) => boolean;
  notFoundMessage?: string;
  forbiddenMessage?: string;
}

const requireAuthorization = <T>(opts: AuthorizationOptions<T>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resource = await opts.getResource(req);
      if (!resource) {
        return res
          .status(404)
          .json({ message: opts.notFoundMessage ?? "Resource not found" });
      }
      if (!opts.authorize(resource, req)) {
        return res
          .status(403)
          .json({ message: opts.forbiddenMessage ?? "Forbidden" });
      }
      return next();
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Authorization check failed",
      });
    }
  };
};

export const requirePostOwner = requireAuthorization({
  getResource: (req) => findPostById(req.params.id as string),
  authorize: (post, req) => post.userId === req.userId,
  notFoundMessage: "Post not found",
  forbiddenMessage: "You can only modify your own posts",
});

export const requireCommentOwner = requireAuthorization({
  getResource: (req) =>
    prisma.comment.findUnique({ where: { id: req.params.id as string } }),
  authorize: (comment, req) => comment.userId === req.userId,
  notFoundMessage: "Comment not found",
  forbiddenMessage: "You can only modify your own comments",
});

export const requireConversationParticipant = requireAuthorization({
  getResource: (req) => findConversationById(req.params.id as string),
  authorize: (conversation, req) =>
    conversation.participantOneId === req.userId ||
    conversation.participantTwoId === req.userId,
  notFoundMessage: "Conversation not found",
  forbiddenMessage: "You are not a participant in this conversation",
});

export const requireConversationMessageOwner = requireAuthorization({
  getResource: (req) => findMessageById(req.params.id as string),
  authorize: (message, req) => message.senderId === req.userId,
  notFoundMessage: "Message not found",
  forbiddenMessage: "You can only modify your own messages",
});

export const requireConversationMessageParticipant = requireAuthorization({
  getResource: (req) => findMessageById(req.params.id as string),
  authorize: (message, req) =>
    message.senderId === req.userId || message.receiverId === req.userId,
  notFoundMessage: "Message not found",
  forbiddenMessage: "You are not a participant in this conversation",
});

export const requireGroupMembership = requireAuthorization({
  getResource: (req) =>
    findGroupMember(req.params.id as string, req.userId as string),
  authorize: () => true,
  notFoundMessage: "You are not a member of this group",
});

export const requireGroupAdmin = requireAuthorization({
  getResource: (req) =>
    findGroupMember(req.params.id as string, req.userId as string),
  authorize: (member) => member.role === "admin",
  notFoundMessage: "You are not a member of this group",
  forbiddenMessage: "Only group admins can perform this action",
});

export const requireGroupMessageOwner = requireAuthorization({
  getResource: (req) => findGroupMessageById(req.params.messageId as string),
  authorize: (message, req) => message.senderId === req.userId,
  notFoundMessage: "Message not found",
  forbiddenMessage: "You can only modify your own messages",
});

export const requireGroupMessageMembership = requireAuthorization({
  getResource: async (req) => {
    const message = await findGroupMessageById(req.params.messageId as string);
    if (!message) return null;
    const member = await findGroupMember(message.groupId, req.userId as string);
    if (!member) return null;
    return message;
  },
  authorize: () => true,
  notFoundMessage: "Message not found or you are not a member of this group",
});

// A host is either the event's creator, or (when the event is hosted by a
// Group) an admin of that Group - see Event.hostGroupId vs Group.eventId in
// the schema, they are deliberately distinct relations.
export const requireEventHost = requireAuthorization({
  getResource: async (req) => {
    const event = await findEventById(req.params.id as string);
    if (!event) return null;
    let isHostGroupAdmin = false;
    if (event.hostGroupId) {
      const member = await findGroupMember(event.hostGroupId, req.userId as string);
      isHostGroupAdmin = member?.role === "admin";
    }
    return { event, isHostGroupAdmin };
  },
  authorize: (resource, req) =>
    resource.event.creatorId === req.userId || resource.isHostGroupAdmin,
  notFoundMessage: "Event not found",
  forbiddenMessage: "Only the event host can perform this action",
});

export const requireSelf = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.params[paramName] !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
};
