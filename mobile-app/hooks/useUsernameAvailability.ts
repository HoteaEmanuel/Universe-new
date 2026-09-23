import { useEffect, useState } from "react";
import { createUsersApi } from "@universe/shared/api";
import { validateUsernameFormat } from "@universe/shared";
import { httpClient } from "../lib/http";
import { useDebounce } from "./useDebounce";

const usersApi = createUsersApi(httpClient);

export type UsernameAvailabilityState = "idle" | "checking" | "available" | "unavailable";

// Mirrors frontend/src/hooks/useUsernameAvailability.ts, swapping its
// window.setTimeout debounce for this app's own useDebounce hook (no
// `window` global to rely on here).
export const useUsernameAvailability = (currentUsername: string, candidateUsername: string) => {
  const [availability, setAvailability] = useState<UsernameAvailabilityState>("idle");
  const [message, setMessage] = useState("");
  const debouncedCandidate = useDebounce(candidateUsername, 350);

  useEffect(() => {
    const username = debouncedCandidate.trim().toLowerCase();
    if (username === currentUsername) {
      setAvailability("idle");
      setMessage("");
      return;
    }

    const formatError = validateUsernameFormat(username);
    if (formatError) {
      setAvailability("unavailable");
      setMessage(formatError);
      return;
    }

    let cancelled = false;
    setAvailability("checking");
    usersApi
      .checkUsernameAvailability(username)
      .then((result) => {
        if (cancelled) return;
        setAvailability(result.available ? "available" : "unavailable");
        setMessage(
          result.available
            ? "Username is available."
            : (result.reason ?? "That username is already taken."),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setAvailability("idle");
        setMessage("Could not check availability. You can still save to try this username.");
      });
    return () => {
      cancelled = true;
    };
  }, [currentUsername, debouncedCandidate]);

  return { availability, message };
};
