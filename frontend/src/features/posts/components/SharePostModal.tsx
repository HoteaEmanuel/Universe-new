import { useMemo, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Check, Link2, Share2 } from "lucide-react";
import { FaUserCircle } from "react-icons/fa";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFullName } from "@/utils/fullName";
import { useGetShareRecipientsQuery } from "@/queryAndMutation/queries/post-queries";
import { useSharePostMutation } from "@/queryAndMutation/mutations/post-mutation";
import type { ShareRecipient } from "@/queryAndMutation/types";

type SharePostModalProps = {
  open: boolean;
  onClose: () => void;
  postId: string;
};

const RecipientRow = ({
  recipient,
  selected,
  onToggle,
}: {
  recipient: ShareRecipient;
  selected: boolean;
  onToggle: () => void;
}) => (
  <li>
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted"
    >
      {recipient.profilePicture ? (
        <img
          src={recipient.profilePicture}
          className="size-11 shrink-0 rounded-full object-cover"
        />
      ) : (
        <FaUserCircle className="size-11 shrink-0 text-muted-foreground" />
      )}
      <p className="min-w-0 flex-1 truncate font-medium">
        {getFullName(recipient)}
      </p>
      <span
        className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border"
        }`}
      >
        {selected && <Check className="size-3.5" />}
      </span>
    </button>
  </li>
);

const SharePostModal = ({ open, onClose, postId }: SharePostModalProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: recipients, isPending } = useGetShareRecipientsQuery(open);
  const { mutate: sharePost, isPending: isSending } =
    useSharePostMutation(postId);

  const shareUrl = `${window.location.origin}/p/${postId}`;

  const filteredRecipients = useMemo(() => {
    if (!recipients) return [];
    const query = searchTerm.trim().toLowerCase();
    if (!query) return recipients;
    return recipients.filter((recipient) =>
      getFullName(recipient).toLowerCase().includes(query),
    );
  }, [recipients, searchTerm]);

  const handleClose = () => {
    setSearchTerm("");
    setSelectedIds(new Set());
    onClose();
  };

  const toggleRecipient = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ url: shareUrl });
      } catch {
        // user dismissed the share sheet
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSend = () => {
    sharePost(Array.from(selectedIds), { onSuccess: handleClose });
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Sheet open={open} onOpenChange={(next: boolean) => !next && handleClose()}>
        <SheetContent
          side="bottom"
          className="mx-auto flex max-h-[80vh] w-full flex-col rounded-t-2xl sm:max-w-md"
        >
          <SheetHeader className="border-b border-border pb-3">
            <SheetTitle>Send post</SheetTitle>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={handleCopyLink}>
                <Link2 /> Copy link
              </Button>
              <Button variant="ghost" className="flex-1" onClick={handleNativeShare}>
                <Share2 /> Share via...
              </Button>
            </div>

            <Input
              type="text"
              placeholder="Search people..."
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />

            {isPending && (
              <p className="pt-4 text-center text-sm text-muted-foreground">
                Loading...
              </p>
            )}

            {!isPending && filteredRecipients.length === 0 && (
              <p className="pt-4 text-center text-sm text-muted-foreground">
                No one to show here yet.
              </p>
            )}

            {!isPending && filteredRecipients.length > 0 && (
              <ul className="flex flex-col gap-1">
                {filteredRecipients.map((recipient) => (
                  <RecipientRow
                    key={recipient.id}
                    recipient={recipient}
                    selected={selectedIds.has(recipient.id)}
                    onToggle={() => toggleRecipient(recipient.id)}
                  />
                ))}
              </ul>
            )}
          </div>
          {selectedIds.size > 0 && (
            <div className="border-t border-border p-4">
              <Button className="w-full" disabled={isSending} onClick={handleSend}>
                Send{selectedIds.size > 1 ? ` to ${selectedIds.size} people` : ""}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default SharePostModal;
