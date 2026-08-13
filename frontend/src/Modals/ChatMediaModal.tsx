import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useParams } from "react-router-dom";
import { Download, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useGetConvoMediaInfinite } from "../queryAndMutation/queries/conversation-queries";
import { useGetGroupMediaInfinite } from "../queryAndMutation/queries/group-queries";
import { formatMonthLabel } from "../features/chat/utils/chatMedia";
import { downloadImage } from "../utils/downloadImage";
import FullImageModal from "./FullImageModal";

type ChatMediaModalProps = {
  open: boolean;
  onClose: () => void;
  variant: "direct" | "group";
};

const SCROLL_FETCH_THRESHOLD = 200;

const ChatMediaModal = ({ open, onClose, variant }: ChatMediaModalProps) => {
  const { id } = useParams();
  const activeId = open ? id : undefined;
  const [fullImage, setFullImage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const convoMedia = useGetConvoMediaInfinite(variant === "direct" ? activeId : undefined);
  const groupMedia = useGetGroupMediaInfinite(variant === "group" ? activeId : undefined);
  const { data, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } =
    variant === "direct" ? convoMedia : groupMedia;

  const pages = data?.pages.filter((page) => page.items.length > 0) ?? [];
  const hasMedia = pages.length > 0;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !open) return;

    const handleScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distanceFromBottom < SCROLL_FETCH_THRESHOLD && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [open, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <>
      <Sheet open={open} onOpenChange={(next: boolean) => !next && onClose()}>
        <SheetContent
          side="bottom"
          className="mx-auto flex max-h-[70vh] w-full flex-col rounded-t-2xl sm:max-w-md"
        >
          <SheetHeader className="border-b border-border pb-3">
            <SheetTitle>Media</SheetTitle>
          </SheetHeader>
          <div ref={containerRef} className="flex-1 overflow-y-auto px-4 pb-4">
            {isPending && (
              <p className="pt-8 text-center text-sm text-muted-foreground">
                Loading...
              </p>
            )}
            {!isPending && !hasMedia && (
              <p className="pt-8 text-center text-sm text-muted-foreground">
                No media shared yet.
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
        </SheetContent>
      </Sheet>

      <FullImageModal
        image={fullImage}
        open={!!fullImage}
        onClose={() => setFullImage(null)}
      />
    </>
  );
};

export default ChatMediaModal;
