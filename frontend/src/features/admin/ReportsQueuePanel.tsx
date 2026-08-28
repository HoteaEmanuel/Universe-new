import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UserAvatar from "@/components/UserAvatar";
import UserListSkeleton from "@/components/UserListSkeleton";
import SearchInput from "@/components/SearchInput";
import { useDebounce } from "@/hooks/Debounce";
import { getFullName } from "@/utils/fullName";
import { formatDateDetailed } from "@/utils/formatDate";
import { urlPathName } from "@/utils/urlPathFromName";
import {
  useGetReportedUsersSummaryQuery,
  useGetReportsInfiniteQuery,
} from "@/queryAndMutation/queries/report-queries";
import {
  REPORT_REASON_OPTIONS,
  REPORT_STATUS_OPTIONS,
  REPORT_TARGET_TYPE_OPTIONS,
  type Report,
  type ReportReason,
  type ReportStatus,
  type ReportTargetType,
} from "@/features/moderation/types";
import ResolveReportDialog from "./ResolveReportDialog";

const SCROLL_FETCH_THRESHOLD = 150;

const STATUS_BADGE_VARIANT: Record<ReportStatus, "destructive" | "secondary" | "muted"> = {
  pending: "destructive",
  resolved: "secondary",
  dismissed: "muted",
};

const snapshotPreviewText = (report: Report) => {
  const snapshot = report.targetSnapshot;
  if (!snapshot) return "Content unavailable";
  if (report.targetType === "post") {
    const s = snapshot as { title?: string | null; body?: string | null };
    return s.title || s.body || "Untitled post";
  }
  if (report.targetType === "comment") {
    return (snapshot as { text: string }).text;
  }
  const s = snapshot as { username: string; name?: string | null };
  return s.name || `@${s.username}`;
};

const getReportPostId = (report: Report) => {
  if (report.targetType === "post") return report.postId;
  if (report.targetType === "comment") {
    return (report.targetSnapshot as { postId?: string } | null)?.postId;
  }
  return undefined;
};

const ReportsQueuePanel = () => {
  const [status, setStatus] = useState<ReportStatus | "all">("pending");
  const [targetType, setTargetType] = useState<ReportTargetType | "all">("all");
  const [reason, setReason] = useState<ReportReason | "all">("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const filters = {
    status: status === "all" ? undefined : status,
    targetType: targetType === "all" ? undefined : targetType,
    reason: reason === "all" ? undefined : reason,
    search: debouncedSearch || undefined,
  };

  const { data, isPending, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetReportsInfiniteQuery(filters);
  const { data: summary } = useGetReportedUsersSummaryQuery();

  const listRef = useRef<HTMLDivElement>(null);
  const reports = data?.pages.flatMap((page) => page.reports) ?? [];

  useEffect(() => {
    const scrollEl = listRef.current;
    if (!scrollEl) return;

    const handleScroll = () => {
      const distanceFromBottom =
        scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
      if (hasNextPage && !isFetchingNextPage && distanceFromBottom < SCROLL_FETCH_THRESHOLD) {
        fetchNextPage();
      }
    };
    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, reports.length]);

  return (
    <div className="flex flex-col gap-5">
      {!!summary?.length && (
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <AlertTriangle className="size-4" />
            Repeat offenders
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {summary.map((row) => (
              <Link
                key={row.user.id}
                to={`/u/${urlPathName(row.user)}`}
                className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 hover:bg-muted/50"
              >
                <UserAvatar user={row.user} className="size-8" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{getFullName(row.user)}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.pendingCount} pending {row.pendingCount === 1 ? "report" : "reports"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search by reported user or reason..."
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant={status === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatus("all")}
          >
            All
          </Button>
          {REPORT_STATUS_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={status === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatus(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <Select
          value={targetType}
          onValueChange={(value: unknown) => setTargetType(value as ReportTargetType | "all")}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {REPORT_TARGET_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={reason}
          onValueChange={(value: unknown) => setReason(value as ReportReason | "all")}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All reasons</SelectItem>
            {REPORT_REASON_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div ref={listRef} className="flex max-h-[65vh] flex-col overflow-y-auto" aria-live="polite">
        {isPending && <UserListSkeleton count={6} lines={2} />}

        {isError && (
          <button
            className="rounded-lg bg-destructive/8 p-6 text-sm font-semibold"
            onClick={() => refetch()}
          >
            Reports could not be loaded. Try again.
          </button>
        )}

        {!isPending && reports.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No reports match these filters.
          </p>
        )}

        {!isPending && reports.length > 0 && (
          <ul className="flex flex-col divide-y divide-border">
            {reports.map((report) => (
              <li key={report.id} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
                <Link to={`/u/${urlPathName(report.reportedUser)}`} className="shrink-0">
                  <UserAvatar user={report.reportedUser} className="size-10" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/u/${urlPathName(report.reportedUser)}`}
                      className="truncate font-medium hover:underline"
                    >
                      {getFullName(report.reportedUser)}
                    </Link>
                    <Badge variant={STATUS_BADGE_VARIANT[report.status]}>{report.status}</Badge>
                    <Badge variant="outline">
                      {REPORT_TARGET_TYPE_OPTIONS.find((o) => o.value === report.targetType)?.label}
                    </Badge>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {REPORT_REASON_OPTIONS.find((o) => o.value === report.reason)?.label} ·{" "}
                    {snapshotPreviewText(report)}
                    {getReportPostId(report) && (
                      <>
                        {" · "}
                        <Link to={`/post/${getReportPostId(report)}`} className="text-foreground hover:underline">
                          View {report.targetType === "post" ? "post" : "comment"}
                        </Link>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Reported {formatDateDetailed(report.createdAt)} by{" "}
                    {report.reporter ? (
                      <Link to={`/u/${urlPathName(report.reporter)}`} className="hover:underline">
                        {getFullName(report.reporter)}
                      </Link>
                    ) : (
                      report.reporterUsername
                    )}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                  <Flag className="size-4" />
                  {report.status === "pending" ? "Review" : "View"}
                </Button>
              </li>
            ))}
          </ul>
        )}

        {isFetchingNextPage && (
          <div className="flex items-center gap-3 py-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        )}
      </div>

      <ResolveReportDialog
        open={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        report={selectedReport}
      />
    </div>
  );
};

export default ReportsQueuePanel;
