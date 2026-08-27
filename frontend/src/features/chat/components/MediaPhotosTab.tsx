import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetConvoResourcesInfinite } from "@/queryAndMutation/queries/conversation-queries";
import { useGetGroupResourcesInfinite } from "@/queryAndMutation/queries/group-queries";
import { formatMonthLabel } from "../utils/chatMedia";
import { downloadImage } from "@/utils/downloadImage";
import FullImageModal from "@/Modals/FullImageModal";
import type { ChatMediaItem } from "../types";

const SCROLL_FETCH_THRESHOLD = 200;

type MediaPhotosTabProps = {
  variant: "direct" | "group";
  id?: string;
};

const MediaPhotosTab = ({ variant, id }: MediaPhotosTabProps) => {
  const [fullImage, setFullImage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const convoMedia = useGetConvoResourcesInfinite<ChatMediaItem>(
    "images",
    variant === "direct" ? id : undefined,
  );
  const groupMedia = useGetGroupResourcesInfinite<ChatMediaItem>(
    "images",
    variant === "group" ? id : undefined,
  );
  const { data, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } =
    variant === "direct" ? convoMedia : groupMedia;

  const pages = data?.pages.filter((page) => page.items.length > 0) ?? [];
  const hasMedia = pages.length > 0;

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
          <p className="pt-8 list-loading-text">
            Loading...
          </p>
        )}
        {!isPending && !hasMedia && (
          <p className="pt-8 list-loading-text">
            No photos shared yet.
          </p>
        )}
        {!isPending && hasMedia && (
          <div className="flex flex-col gap-4 pt-1">
            {pages.map((page) => (
              <div key={page.nextCursor}>
                <h2 className="pb-2 text-xs font-medium text-muted-foreground">
                  {formatMonthLabel(page.nextCursor as string)}
                </h2>
                <div className="grid grid-cols-3 gap-1">
                  {page.items.map((item, index) => (
                    <div
                      key={`${item.messageId}-${index}`}
                      className="group relative aspect-square cursor-pointer overflow-hidden rounded-md"
                      onClick={() => setFullImage(item.url)}
                    >
                      <img
                        src={item.url}
                        alt="Shared media"
                        className="size-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon-sm"
                        aria-label="Download image"
                        className="absolute top-1 right-1 opacity-0 shadow-md transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                        onClick={(event: MouseEvent) => {
                          event.stopPropagation();
                          downloadImage(item.url);
                        }}
                      >
                        <Download />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {isFetchingNextPage && (
              <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      <FullImageModal
        image={fullImage}
        open={!!fullImage}
        onClose={() => setFullImage(null)}
      />
    </>
  );
};

export default MediaPhotosTab;
