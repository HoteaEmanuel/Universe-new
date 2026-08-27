import { useMemo, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Compass, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/Debounce";
import { useGetAllUsersQuery } from "@/queryAndMutation/queries/user-queries";
import { getFullName } from "@/utils/fullName";
import UserAvatar from "@/components/UserAvatar";
import CreateGroupModal from "@/features/groups/components/CreateGroupModal";
import DiscoverGroupsModal from "@/features/groups/components/DiscoverGroupsModal";
import type { ChatUser } from "./types";

const NewConversation = () => {
  const navigate = useNavigate();
  const { data: users, isPending } = useGetAllUsersQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);

  const results = useMemo<ChatUser[]>(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (query.length < 2 || !users) return [];
    return users.filter((candidate: ChatUser) =>
      getFullName(candidate).toLowerCase().includes(query),
    );
  }, [users, debouncedSearch]);

  const hasQuery = debouncedSearch.trim().length >= 2;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Back"
                onClick={() => navigate("/chat")}
              />
            }
          >
            <ArrowLeft />
          </TooltipTrigger>
          <TooltipContent>Back</TooltipContent>
        </Tooltip>
        <h1 className="text-xl font-semibold">New message</h1>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search for any user"
          className="pl-8"
          value={searchTerm}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setSearchTerm(e.target.value)
          }
        />
      </div>

      {isPending && (
        <ul className="flex flex-col gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="size-11 shrink-0 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </li>
          ))}
        </ul>
      )}

      {!isPending && hasQuery && results.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No users found for &quot;{searchTerm}&quot;
        </p>
      )}

      {!isPending && results.length > 0 && (
        <ul className="flex flex-col gap-1">
          {results.map((candidate) => (
            <li key={candidate.id}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(`/new-conversation/${candidate.id}`)}
                className="h-auto w-full justify-start gap-3 rounded-xl p-2 text-left"
              >
                <UserAvatar user={candidate} className="size-11" />
                <span className="font-medium">{getFullName(candidate)}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => setCreateGroupOpen(true)}
        >
          <Users />
          Create a group
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => setDiscoverOpen(true)}
        >
          <Compass />
          Discover groups
        </Button>
      </div>

      <CreateGroupModal
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
      />
      <DiscoverGroupsModal
        open={discoverOpen}
        onClose={() => setDiscoverOpen(false)}
      />
    </section>
  );
};

export default NewConversation;
