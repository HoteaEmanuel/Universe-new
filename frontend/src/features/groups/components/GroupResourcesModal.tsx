import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Download,
  EllipsisVertical,
  FileText,
  Link2,
  Pin,
  PinOff,
  Plus,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SearchInput from "@/components/SearchInput";
import UserAvatar from "@/components/UserAvatar";
import UserListSkeleton from "@/components/UserListSkeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDebounce } from "@/hooks/Debounce";
import { useShowSearchInput } from "@/hooks/useShowSearchInput";
import { getFullName } from "@/utils/fullName";
import { useAuthStore } from "@/store/authStore";
import {
  useCheckUserIsAdminQuery,
  useGetCourseResourcesInfiniteQuery,
} from "@/queryAndMutation/queries/group-queries";
import {
  useDeleteCourseResourceMutation,
  useDownloadCourseResourceMutation,
  useToggleCourseResourceHelpfulMutation,
  useToggleCourseResourcePinMutation,
} from "@/queryAndMutation/mutations/group-mutation";
import type { ChatUser } from "@/features/chat/types";
import type { CourseResource, ResourceCategory } from "@/features/chat/types";
import AddResourceModal from "./AddResourceModal";

type GroupResourcesModalProps = {
  open: boolean;
  onClose: () => void;
};

const SCROLL_THRESHOLD_PX = 150;

const CATEGORY_FILTERS: { value: ResourceCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "lecture_notes", label: "Notes" },
  { value: "assignment", label: "Assignments" },
  { value: "exam_prep", label: "Exam prep" },
  { value: "link", label: "Links" },
  { value: "recording", label: "Recordings" },
  { value: "other", label: "Other" },
];

const CATEGORY_LABEL: Record<ResourceCategory, string> = {
  lecture_notes: "Lecture notes",
  assignment: "Assignment",
  exam_prep: "Exam prep",
  link: "Link",
  recording: "Recording",
  other: "Other",
};

const formatFileSize = (bytes?: number | null) => {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ResourceRow = ({
  resource,
  isAdmin,
  currentUserId,
}: {
  resource: CourseResource;
  isAdmin: boolean;
  currentUserId: string;
}) => {
  const { id: groupId } = useParams();
  const { mutate: download } = useDownloadCourseResourceMutation(groupId);
  const { mutate: toggleHelpful } = useToggleCourseResourceHelpfulMutation(groupId);
  const { mutate: togglePin } = useToggleCourseResourcePinMutation(groupId);
  const { mutate: deleteResource } = useDeleteCourseResourceMutation(groupId);
  const canModify = isAdmin || resource.uploaderId === currentUserId;
  const isLink = !!resource.linkUrl;

  return (
    <li className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted/50">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        {isLink ? (
          <Link2 className="size-4 text-muted-foreground" />
        ) : (
          <FileText className="size-4 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {resource.pinned && <Pin className="size-3 shrink-0 text-primary" />}
          <p className="truncate font-medium">{resource.title}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <Badge variant="brand">{CATEGORY_LABEL[resource.category]}</Badge>
          {resource.week && <Badge variant="muted">{resource.week}</Badge>}
          {formatFileSize(resource.fileSize) && (
            <span className="text-xs text-muted-foreground">
              {formatFileSize(resource.fileSize)}
            </span>
          )}
        </div>
        {resource.description && (
          <p className="line-clamp-2 pt-1 text-sm text-muted-foreground">
            {resource.description}
          </p>
        )}
        <div className="flex items-center gap-3 pt-1.5">
          <UserAvatar
            user={resource.uploader}
            name={getFullName(resource.uploader as ChatUser)}
            className="size-5"
          />
          <span className="text-xs text-muted-foreground">
            {getFullName(resource.uploader as ChatUser)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto gap-1 px-1.5 py-0.5 text-xs"
            onClick={() => toggleHelpful(resource.id)}
          >
            <ThumbsUp
              className={resource.votedHelpful ? "size-3 fill-primary text-primary" : "size-3"}
            />
            {resource.helpfulCount}
          </Button>
          <span className="text-xs text-muted-foreground">
            {resource.downloadCount} downloads
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={isLink ? "Open link" : "Download file"}
          onClick={() => download(resource.id)}
        >
          <Download className="size-4" />
        </Button>
        {(isAdmin || canModify) && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" aria-label="Resource options" />}
            >
              <EllipsisVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isAdmin && (
                <DropdownMenuItem onClick={() => togglePin(resource.id)}>
                  {resource.pinned ? <PinOff /> : <Pin />}
                  {resource.pinned ? "Unpin" : "Pin"}
                </DropdownMenuItem>
              )}
              {canModify && (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => deleteResource(resource.id)}
                >
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </li>
  );
};

const GroupResourcesModal = ({ open, onClose }: GroupResourcesModalProps) => {
  const { id: groupId } = useParams();
  const { user } = useAuthStore() as { user: ChatUser };
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ResourceCategory | "all">("all");
  const [addOpen, setAddOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const { data: isAdmin } = useCheckUserIsAdminQuery(groupId, user.id);
  const { data, isPending, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetCourseResourcesInfiniteQuery(
      groupId,
      open,
      category === "all" ? undefined : category,
      debouncedSearch,
    );
  const resources = data?.pages.flatMap((page) => page.items) ?? [];
  const showSearch = useShowSearchInput(
    resources.length,
    !!debouncedSearch.trim() || category !== "all",
    isPending,
  );

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const distanceFromBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight;
    if (
      distanceFromBottom < SCROLL_THRESHOLD_PX &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  };

  return (
    <Drawer open={open} onOpenChange={(next: boolean) => !next && onClose()}>
      <DrawerContent className="sm:max-w-xl">
        <DrawerHeader className="flex-row items-center justify-between border-b border-border pr-12 pb-3">
          <DrawerTitle>Resources</DrawerTitle>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-3.5" />
            Add
          </Button>
        </DrawerHeader>
        {showSearch && (
          <SearchInput
            onChange={setSearch}
            value={search}
            className="shrink-0 px-2"
            placeholder="Search resources..."
          />
        )}
        <div className="flex shrink-0 gap-1.5 overflow-x-auto px-2 pb-2">
          {CATEGORY_FILTERS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={category === option.value ? "default" : "outline"}
              className="shrink-0"
              onClick={() => setCategory(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <DrawerBody className="h-full px-4 pb-4" onScroll={handleScroll}>
          {isPending && <UserListSkeleton />}
          {!isPending && resources.length === 0 && (
            <p className="pt-8 list-loading-text">No resources yet.</p>
          )}
          {!isPending && resources.length > 0 && (
            <ul className="flex flex-col gap-1 pt-1">
              {resources.map((resource) => (
                <ResourceRow
                  key={resource.id}
                  resource={resource}
                  isAdmin={!!isAdmin}
                  currentUserId={user.id}
                />
              ))}
            </ul>
          )}
        </DrawerBody>
      </DrawerContent>
      <AddResourceModal open={addOpen} onClose={() => setAddOpen(false)} />
    </Drawer>
  );
};

export default GroupResourcesModal;
