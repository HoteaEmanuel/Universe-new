import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";
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

      <Button
        type="button"
        variant="ghost"
        onClick={goToProfile}
        className="relative h-auto shrink-0 rounded-full p-0 hover:bg-transparent"
      >
        <UserAvatar user={user} className="size-11" />
        {isOnline && (
          <span className="online-dot right-0 bottom-0 size-3" />
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={goToProfile}
        className="h-auto min-w-0 flex-1 flex-col items-start p-0 text-left hover:bg-transparent"
      >
        <h1 className="truncate text-base font-semibold">
          {getFullName(user)}
        </h1>
        {user.accountType !== "business" && user.university && (
          <p className="truncate text-xs text-muted-foreground">
            {user.university}
          </p>
        )}
      </Button>

      {actions}
    </div>
  );
};

export default ChatUserHeader;
