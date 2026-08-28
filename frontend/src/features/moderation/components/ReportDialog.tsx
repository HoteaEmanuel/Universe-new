import { useEffect, useState, type ChangeEvent, type MouseEvent } from "react";
import { Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateReportMutation } from "@/queryAndMutation/mutations/report-mutation";
import {
  REPORT_REASON_OPTIONS,
  type CreateReportPayload,
  type ReportReason,
  type ReportTargetType,
} from "@/features/moderation/types";

const MAX_DETAILS_LENGTH = 500;

const TARGET_TYPE_COPY: Record<
  ReportTargetType,
  { title: string; description: string }
> = {
  post: {
    title: "Report post",
    description:
      "Let us know what's wrong with this post. The person who posted it won't see who reported it.",
  },
  comment: {
    title: "Report comment",
    description:
      "Let us know what's wrong with this comment. The commenter won't see who reported it.",
  },
  user_profile: {
    title: "Report account",
    description:
      "Let us know what's wrong with this account. They won't see who reported it.",
  },
};

type ReportDialogProps = {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
};

const ReportDialog = ({
  open,
  onClose,
  targetType,
  targetId,
}: ReportDialogProps) => {
  const [reason, setReason] = useState<ReportReason | undefined>(undefined);
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(false);
  const { mutate: createReport, isPending } = useCreateReportMutation();

  useEffect(() => {
    if (!open) {
      setReason(undefined);
      setDetails("");
      setAlsoBlock(false);
    }
  }, [open]);

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  const canSubmit = !!reason;

  const handleSubmit = () => {
    if (!reason) return;
    const base = {
      reason,
      details: details.trim() || undefined,
      alsoBlock: alsoBlock || undefined,
    };
    const payload: CreateReportPayload =
      targetType === "post"
        ? { targetType, postId: targetId, ...base }
        : targetType === "comment"
          ? { targetType, commentId: targetId, ...base }
          : { targetType, reportedUserId: targetId, ...base };

    createReport(payload, { onSuccess: handleClose });
  };

  const copy = TARGET_TYPE_COPY[targetType];

  return (
    <Dialog
      open={open}
      onOpenChange={(next: boolean) => !next && handleClose()}
    >
      <DialogContent
        className="sm:max-w-md"
        onClick={(e: MouseEvent) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="size-4.5 text-destructive" />
            {copy.title}
          </DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div
            className="flex flex-col gap-1.5"
          >
            <Label>Reason</Label>
            <Select
              value={reason}
              onValueChange={(value: unknown) => {
                setReason(value as ReportReason);
              }}
              disabled={isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASON_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="report-details">
              Additional details (optional)
            </Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setDetails(e.target.value)
              }
              placeholder="Add any context that could help our review..."
              maxLength={MAX_DETAILS_LENGTH}
              disabled={isPending}
            />
            <p className="text-right text-xs text-muted-foreground">
              {details.length}/{MAX_DETAILS_LENGTH}
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={alsoBlock}
              onCheckedChange={(checked: boolean) => setAlsoBlock(!!checked)}
              disabled={isPending}
            />
            Also block this user
          </label>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!canSubmit || isPending}
            onClick={handleSubmit}
          >
            {isPending ? "Submitting..." : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
