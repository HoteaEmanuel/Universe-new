import { useEffect, useState } from "react";
import { createUsersApi } from "@universe/shared/api";
import { httpClient } from "@/lib/api";
import { validateUsernameFormat } from "@/utils/usernameValidation";

const usersApi = createUsersApi(httpClient);

export type UsernameAvailabilityState =
  | "idle"
  | "checking"
  | "available"
  | "unavailable";

// Shared by EditProfile and the onboarding identity step - debounces a
// server availability check behind the same format/reserved-word/language
// validation used everywhere a username can be claimed.
export const useUsernameAvailability = (
  currentUsername: string,
  candidateUsername: string,
) => {
  const [availability, setAvailability] = useState<UsernameAvailabilityState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const username = candidateUsername.trim().toLowerCase();
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

    setAvailability("checking");
    const timer = window.setTimeout(() => {
      usersApi
        .checkUsernameAvailability(username)
        .then((result) => {
          setAvailability(result.available ? "available" : "unavailable");
          setMessage(
            result.available
              ? "Username is available."
              : (result.reason ?? "That username is already taken."),
          );
        })
        .catch(() => {
          setAvailability("idle");
          setMessage("Could not check availability. You can still save to try this username.");
        });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [currentUsername, candidateUsername]);

  return { availability, message };
};
