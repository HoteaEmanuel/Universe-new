import { useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ExternalLink, Flag, ShieldOff, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import UserAvatar from "@/components/UserAvatar";
import { useResolveReportMutation } from "@/queryAndMutation/mutations/report-mutation";
import { getFullName } from "@/utils/fullName";
import { formatDateDetailed } from "@/utils/formatDate";
import { urlPathName } from "@/utils/urlPathFromName";
import {
  REPORT_REASON_OPTIONS,
  type PostReportSnapshot,
  type CommentReportSnapshot,
  type ProfileReportSnapshot,
  type Report,
  type ReportResolveAction,
  type ReportStatus,
} from "@/features/moderation/types";

const MAX_NOTE_LENGTH = 500;

const STATUS_VARIANT: Record<ReportStatus, "destructive" | "secondary" | "muted"> = {
  pending: "destructive",
  resolved: "secondary",
  dismissed: "muted",
};

const reasonLabel = (reason: string) =>
  REPORT_REASON_OPTIONS.find((option) => option.value === reason)?.label ?? reason;

const getReportPostId = (report: Report) => {
  if (report.targetType === "post") return report.postId;
  if (report.targetType === "comment") {
    return (report.targetSnapshot as { postId?: string } | null)?.postId;
  }
  return undefined;
};

const SnapshotPreview = ({ report }: { report: Report }) => {
  const snapshot = report.targetSnapshot;
  const postId = getReportPostId(report);
  const viewLink = postId && (
    <Link
      to={`/post/${postId}`}
      className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
    >
      <ExternalLink className="size-3" />
      View {report.targetType === "post" ? "post" : "comment"}
    </Link>
  );

  if (!snapshot) {
    return (
      <div className="text-sm">
        <p className="italic text-muted-foreground">No content snapshot available.</p>
        {viewLink}
      </div>
    );
  }

  if (report.targetType === "post") {
    const s = snapshot as PostReportSnapshot;
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
        <p className="text-xs text-muted-foreground">Post by @{s.authorUsername}</p>
        {s.title && <p className="font-medium">{s.title}</p>}
        {s.body && <p className="mt-1 line-clamp-4 wrap-break-word">{s.body}</p>}
        {!!s.imagesUrls?.length && (
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {s.imagesUrls.slice(0, 3).map((url) => (
              <img key={url} src={url} alt="" className="size-16 shrink-0 rounded-md object-cover" />
            ))}
          </div>
        )}
        {viewLink}
      </div>
    );
  }

  if (report.targetType === "comment") {
    const s = snapshot as CommentReportSnapshot;
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
        <p className="text-xs text-muted-foreground">Comment by @{s.authorUsername}</p>
        <p className="mt-1 line-clamp-4 wrap-break-word">{s.text}</p>
        {viewLink}
      </div>
    );
  }

  const s = snapshot as ProfileReportSnapshot;
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
      <p className="text-xs text-muted-foreground">Profile snapshot</p>
      <p className="font-medium">{s.name || `@${s.username}`}</p>
      {s.bio && <p className="mt-1 line-clamp-3 wrap-break-word text-muted-foreground">{s.bio}</p>}
    </div>
  );
};

type ResolveReportDialogProps = {
  open: boolean;
  onClose: () => void;
  report: Report | null;
};

const ResolveReportDialog = ({ open, onClose, report }: ResolveReportDialogProps) => {
  const [note, setNote] = useState("");
  const { mutate: resolveReport, isPending, variables } = useResolveReportMutation();

  const handleClose = () => {
    if (isPending) return;
    setNote("");
    onClose();
  };

  if (!report) return null;

  const isRunning = (action: ReportResolveAction) =>
    isPending && variables?.action === action;

  const handleAction = (action: ReportResolveAction) => {
    resolveReport(
      { id: report.id, action, note: note.trim() || undefined },
      { onSuccess: handleClose },
    );
  };

  const isPendingStatus = report.status === "pending";

  return (
    <Dialog open={open} onOpenChange={(next: boolean) => !next && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="size-4.5 text-destructive" />
            Report review
          </DialogTitle>
          <DialogDescription>
            Filed {formatDateDetailed(report.createdAt)} by{" "}
            {report.reporter ? (
              <Link to={`/u/${urlPathName(report.reporter)}`} className="hover:underline">
                {getFullName(report.reporter)}
              </Link>
            ) : (
              report.reporterUsername
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_VARIANT[report.status]}>{report.status}</Badge>
            <Badge variant="outline">{reasonLabel(report.reason)}</Badge>
          </div>

          <Link to={`/u/${urlPathName(report.reportedUser)}`} className="flex items-center gap-2.5">
            <UserAvatar user={report.reportedUser} className="size-9" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium hover:underline">
                {getFullName(report.reportedUser)}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                @{report.reportedUser.username}
              </p>
            </div>
          </Link>

          <SnapshotPreview report={report} />

          {report.details && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Reporter&apos;s notes</p>
              <p className="text-sm wrap-break-word">{report.details}</p>
            </div>
          )}

          {!isPendingStatus && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p>
                <span className="font-medium capitalize">{report.action.replace("_", " ")}</span>
                {report.reviewedBy && ` by ${getFullName(report.reviewedBy)}`}
                {report.reviewedAt && ` on ${formatDateDetailed(report.reviewedAt)}`}
              </p>
              {report.resolutionNote && (
                <p className="mt-1 text-muted-foreground">{report.resolutionNote}</p>
              )}
            </div>
          )}

          {isPendingStatus && (
            <div className="flex flex-col gap-1.5">
              <Textarea
                value={note}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
                placeholder="Note (optional, shared with the user if you remove content or block them)"
                maxLength={MAX_NOTE_LENGTH}
                disabled={isPending}
              />
              <p className="text-right text-xs text-muted-foreground">
                {note.length}/{MAX_NOTE_LENGTH}
              </p>
            </div>
          )}
        </div>

        {isPendingStatus && (
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleAction("dismiss")}
            >
              <CheckCircle2 className="size-4" />
              {isRunning("dismiss") ? "Dismissing..." : "Dismiss"}
            </Button>
            {report.targetType !== "user_profile" && (
              <Button
                type="button"
                variant="destructive"
                disabled={isPending}
                onClick={() => handleAction("remove_content")}
              >
                <Trash2 className="size-4" />
                {isRunning("remove_content") ? "Removing..." : "Remove content"}
              </Button>
            )}
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() => handleAction("block_user")}
            >
              <ShieldOff className="size-4" />
              {isRunning("block_user") ? "Blocking..." : "Block user"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ResolveReportDialog;
