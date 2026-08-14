import type { InfiniteData } from "@tanstack/react-query";
import type { ChatMessage, ChatMessagePage } from "../types";

type MessagesCache = InfiniteData<ChatMessagePage>;

export const appendOptimisticMessage = (
  data: MessagesCache | undefined,
  message: ChatMessage,
): MessagesCache | undefined => {
  if (!data || data.pages.length === 0) return data;
  const pages = [...data.pages];
  const latest = pages[0];
  pages[0] = { ...latest, messages: [...latest.messages, message] };
  return { ...data, pages };
};

export const updateMessageInPages = (
  data: MessagesCache | undefined,
  messageId: string,
  update: (message: ChatMessage) => ChatMessage,
): MessagesCache | undefined => {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      messages: page.messages.map((m) => (m.id === messageId ? update(m) : m)),
    })),
  };
};

export const setReactionInPages = (
  data: MessagesCache | undefined,
  messageId: string,
  userId: string,
  emoji: string,
): MessagesCache | undefined =>
  updateMessageInPages(data, messageId, (message) => {
    const reactions = message.reactions ?? [];
    const existing = reactions.find((r) => r.userId === userId);
    const others = reactions.filter((r) => r.userId !== userId);
    return {
      ...message,
      reactions:
        existing?.emoji === emoji
          ? others
          : [...others, { id: existing?.id ?? `optimistic-${Date.now()}`, emoji, userId }],
    };
  });
