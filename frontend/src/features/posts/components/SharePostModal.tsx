import { useMemo, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Check, Link2, Share2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFullName } from "@/utils/fullName";
import UserAvatar from "@/components/UserAvatar";
import { useGetShareRecipientsQuery } from "@/queryAndMutation/queries/post-queries";
import { useSharePostMutation } from "@/queryAndMutation/mutations/post-mutation";

type SharePostModalProps = {
  open: boolean;
  onClose: () => void;
  postId: string;
};

type ShareTarget = {
  key: string;
  kind: "user" | "group";
  id: string;
  label: string;
  avatarUrl: string | null;
  activityAt: number;
};

const TargetRow = ({
  target,
  selected,
  onToggle,
}: {
  target: ShareTarget;
  selected: boolean;
  onToggle: () => void;
}) => (
  <li>
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted"
    >
      <UserAvatar user={{ profilePicture: target.avatarUrl, name: target.label }} />
      <p className="min-w-0 flex-1 truncate font-medium">{target.label}</p>
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
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const { data, isPending } = useGetShareRecipientsQuery(open);
  const { mutate: sharePost, isPending: isSending } =
    useSharePostMutation(postId);

  const shareUrl = `${window.location.origin}/p/${postId}`;

  const targets = useMemo<ShareTarget[]>(() => {
    if (!data) return [];
    const userTargets: ShareTarget[] = data.recipients.map((recipient) => ({
      key: `user:${recipient.id}`,
      kind: "user",
      id: recipient.id,
      label: getFullName(recipient),
      avatarUrl: recipient.profilePicture ?? null,
      activityAt: new Date(recipient.lastInteractionAt).getTime(),
    }));
    const groupTargets: ShareTarget[] = data.groups.map((group) => ({
      key: `group:${group.id}`,
      kind: "group",
      id: group.id,
      label: group.name,
      avatarUrl: group.coverImageUrl,
      activityAt: new Date(group.lastActivityAt).getTime(),
    }));
    return [...userTargets, ...groupTargets].sort(
      (a, b) => b.activityAt - a.activityAt,
    );
  }, [data]);

  const filteredTargets = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return targets;
    return targets.filter((target) => target.label.toLowerCase().includes(query));
  }, [targets, searchTerm]);

  const handleClose = () => {
    setSearchTerm("");
    setSelectedKeys(new Set());
    onClose();
  };

  const toggleTarget = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
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
    const recipientIds: string[] = [];
    const groupIds: string[] = [];
    selectedKeys.forEach((key) => {
      const [kind, id] = key.split(":");
      if (kind === "group") groupIds.push(id);
      else recipientIds.push(id);
    });
    sharePost({ recipientIds, groupIds }, { onSuccess: handleClose });
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
              placeholder="Search people and groups..."
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />

            {isPending && (
              <p className="pt-4 list-loading-text">
                Loading...
              </p>
            )}

            {!isPending && filteredTargets.length === 0 && (
              <p className="pt-4 list-loading-text">
                No one to show here yet.
              </p>
            )}

            {!isPending && filteredTargets.length > 0 && (
              <ul className="flex flex-col gap-1">
                {filteredTargets.map((target) => (
                  <TargetRow
                    key={target.key}
                    target={target}
                    selected={selectedKeys.has(target.key)}
                    onToggle={() => toggleTarget(target.key)}
                  />
                ))}
              </ul>
            )}
          </div>
          {selectedKeys.size > 0 && (
            <div className="border-t border-border p-4">
              <Button className="w-full" disabled={isSending} onClick={handleSend}>
                Send{selectedKeys.size > 1 ? ` to ${selectedKeys.size}` : ""}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default SharePostModal;
