import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../../../store/authStore";

export type TypingUser = { userId: string; name: string };

type TypingSocket = {
  on: (event: string, handler: (...args: any[]) => void) => void;
  off?: (event: string, handler: (...args: any[]) => void) => void;
};

const TYPING_EXPIRY_MS = 3000;

export const useTypingIndicator = (id?: string) => {
  const { socket } = useAuthStore() as { socket: TypingSocket };
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    setTypingUsers([]);
    Object.values(timeoutsRef.current).forEach(clearTimeout);
    timeoutsRef.current = {};
  }, [id]);

  useEffect(() => {
    if (!id || !socket) return;

    const removeUser = (userId: string) => {
      if (timeoutsRef.current[userId]) {
        clearTimeout(timeoutsRef.current[userId]);
        delete timeoutsRef.current[userId];
      }
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    };

    const handleUserTyping = (payload: { id: string; userId: string; name: string }) => {
      if (payload.id !== id) return;
      setTypingUsers((prev) =>
        prev.some((u) => u.userId === payload.userId)
          ? prev
          : [...prev, { userId: payload.userId, name: payload.name }],
      );
      if (timeoutsRef.current[payload.userId]) {
        clearTimeout(timeoutsRef.current[payload.userId]);
      }
      timeoutsRef.current[payload.userId] = setTimeout(
        () => removeUser(payload.userId),
        TYPING_EXPIRY_MS,
      );
    };

    const handleUserStoppedTyping = (payload: { id: string; userId: string }) => {
      if (payload.id !== id) return;
      removeUser(payload.userId);
    };

    socket.on("userTyping", handleUserTyping);
    socket.on("userStoppedTyping", handleUserStoppedTyping);

    return () => {
      socket.off?.("userTyping", handleUserTyping);
      socket.off?.("userStoppedTyping", handleUserStoppedTyping);
      Object.values(timeoutsRef.current).forEach(clearTimeout);
      timeoutsRef.current = {};
    };
  }, [socket, id]);

  return typingUsers;
};
