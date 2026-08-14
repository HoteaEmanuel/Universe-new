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
