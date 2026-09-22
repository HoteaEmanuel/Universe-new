import { useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { router } from "expo-router";
const LoggedUserOnly = ({ children }) => {
  // See the identical note in GuestsOnly.jsx: select the id, not the whole
  // `user` object, so this effect doesn't re-fire on every unrelated store
  // update.
  const userId = useAuthStore((state) => state.user?.id);
  useEffect(() => {
    if (userId == null) {
      router.replace("/login");
    }
  }, [userId]);
  return children;
};

export default LoggedUserOnly;
