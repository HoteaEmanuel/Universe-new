import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetConvoResourcesInfinite } from "@/queryAndMutation/queries/conversation-queries";
import { useGetGroupResourcesInfinite } from "@/queryAndMutation/queries/group-queries";
import { formatMonthLabel } from "../utils/chatMedia";
import { formatFileSize } from "../utils/formatFileSize";
import { getFileTypeIcon } from "../utils/fileTypeIcon";
import { downloadFile } from "@/utils/downloadFile";
import FilePreviewModal from "@/Modals/FilePreviewModal";
import type { ChatFileItem, MessageAttachment } from "../types";

const SCROLL_FETCH_THRESHOLD = 200;

type MediaFilesTabProps = {
  variant: "direct" | "group";
  id?: string;
};

const toAttachment = (item: ChatFileItem): MessageAttachment => ({
  id: item.id,
  fileUrl: item.fileUrl,
  fileName: item.fileName,
  fileSize: item.fileSize,
  mimeType: item.mimeType,
});

const MediaFilesTab = ({ variant, id }: MediaFilesTabProps) => {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const convoFiles = useGetConvoResourcesInfinite<ChatFileItem>(
    "files",
    variant === "direct" ? id : undefined,
  );
  const groupFiles = useGetGroupResourcesInfinite<ChatFileItem>(
    "files",
    variant === "group" ? id : undefined,
  );
  const { data, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } =
    variant === "direct" ? convoFiles : groupFiles;

  const pages = data?.pages.filter((page) => page.items.length > 0) ?? [];
  const hasFiles = pages.length > 0;
  const allItems = pages.flatMap((page) => page.items);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distanceFromBottom < SCROLL_FETCH_THRESHOLD && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <>
      <div ref={containerRef} className="max-h-[55vh] overflow-y-auto">
        {isPending && (
          <p className="pt-8 text-center text-sm text-muted-foreground">
            Loading...
          </p>
        )}
        {!isPending && !hasFiles && (
          <p className="pt-8 text-center text-sm text-muted-foreground">
            No files shared yet.
          </p>
        )}
        {!isPending && hasFiles && (
          <div className="flex flex-col gap-4 pt-1">
            {pages.map((page) => (
              <div key={page.nextCursor}>
                <h2 className="pb-2 text-xs font-medium text-muted-foreground">
                  {formatMonthLabel(page.nextCursor as string)}
                </h2>
                <ul className="flex flex-col gap-1">
                  {page.items.map((item) => {
                    const Icon = getFileTypeIcon(item.mimeType);
                    return (
                      <li
                        key={item.id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-muted"
                        onClick={() =>
                          setPreviewIndex(allItems.findIndex((i) => i.id === item.id))
                        }
                      >
                        <Icon className="size-5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(item.fileSize)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Download file"
                          onClick={(event: MouseEvent) => {
                            event.stopPropagation();
                            downloadFile(item.fileUrl, item.fileName);
                          }}
                        >
                          <Download />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            {isFetchingNextPage && (
              <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      <FilePreviewModal
        attachments={allItems.map(toAttachment)}
        open={previewIndex !== null}
        initialIndex={previewIndex ?? 0}
        onClose={() => setPreviewIndex(null)}
      />
    </>
  );
};

export default MediaFilesTab;
