import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { FaUserCircle } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { getFullName } from "../../../utils/fullName";
import { urlPathName } from "../../../utils/urlPathFromName";
import type { ChatUser } from "../types";

type ChatUserHeaderProps = {
  user: ChatUser;
  isOnline?: boolean;
  actions?: ReactNode;
};

const ChatUserHeader = ({ user, isOnline, actions }: ChatUserHeaderProps) => {
  const navigate = useNavigate();
  const goToProfile = () => navigate(`/u/${urlPathName(user)}`);

  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Back to messages"
        className="shrink-0"
        onClick={() => navigate("/chat")}
      >
        <ArrowLeft />
      </Button>

      <button
        type="button"
        onClick={goToProfile}
        className="relative shrink-0 cursor-pointer"
      >
        {user.profilePicture ? (
          <img
            src={user.profilePicture}
            alt={getFullName(user)}
            className="size-11 rounded-full object-cover"
          />
        ) : (
          <FaUserCircle className="size-11 text-muted-foreground" />
        )}
        {isOnline && (
          <span className="absolute right-0 bottom-0 size-3 rounded-full bg-green-500 ring-2 ring-background" />
        )}
      </button>

      <button
        type="button"
        onClick={goToProfile}
        className="flex min-w-0 flex-1 flex-col items-start text-left cursor-pointer"
      >
        <h1 className="truncate text-base font-semibold">
          {getFullName(user)}
        </h1>
        {user.accountType !== "business" && user.university && (
          <p className="truncate text-xs text-muted-foreground">
            {user.university}
          </p>
        )}
      </button>

      {actions}
    </div>
  );
};

export default ChatUserHeader;
