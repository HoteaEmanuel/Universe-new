import type { MouseEvent } from "react";
import { BadgeCheck, BriefcaseBusiness, CalendarClock, ExternalLink, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Post } from "@/queryAndMutation/types";
import { useSetOpportunityClosedMutation } from "@/queryAndMutation/mutations/post-mutation";

const LABELS = {
  internship: "Internship",
  part_time: "Part-time",
  full_time: "Full-time",
  graduate_program: "Graduate program",
  volunteering: "Volunteering",
  campus_ambassador: "Campus ambassador",
  onsite: "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
} as const;

const formatDeadline = (value?: string | null) => {
  if (!value) return null;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
};

const destination = (url?: string | null) => {
  if (!url) return null;
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return null; }
};

export default function OpportunitySummary({ post, isOwner }: { post: Post; isOwner: boolean }) {
  const statusMutation = useSetOpportunityClosedMutation(post.id);
  const expired = !!post.isOpportunityExpired;
  const host = destination(post.applyUrl);
  const deadline = formatDeadline(post.deadlineAt);

  const apply = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!expired && post.applyUrl) window.open(post.applyUrl, "_blank", "noopener,noreferrer");
  };

  const toggleStatus = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    statusMutation.mutate(!post.opportunityClosedAt);
  };

  return (
    <section className="mx-4 mt-2 rounded-2xl bg-primary/[0.06] p-4 text-left dark:bg-brand-400/10" aria-label="Opportunity details">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="brand"><BriefcaseBusiness className="size-3" />{post.opportunityType ? LABELS[post.opportunityType] : "Opportunity"}</Badge>
        {post.workplaceType && <Badge variant="muted">{LABELS[post.workplaceType]}</Badge>}
        {expired && <Badge variant="destructive">Applications closed</Badge>}
      </div>

      <div className="mt-3 flex flex-col gap-1.5 text-sm">
        {post.companyName && (
          <p className="flex items-center gap-1.5 font-semibold"><BadgeCheck className="size-4 text-primary" />{post.companyName}</p>
        )}
        {post.location && (
          <p className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="size-4" />{post.location}</p>
        )}
        {deadline && (
          <p className="flex items-center gap-1.5 text-muted-foreground"><CalendarClock className="size-4" />Apply by {deadline}</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="button" onClick={apply} disabled={expired || !post.applyUrl} className="gap-1.5">
          <ExternalLink className="size-4" />
          {expired ? "Applications closed" : "Apply externally"}
        </Button>
        {host && !expired && <span className="text-xs text-muted-foreground">Opens {host}</span>}
        {isOwner && (
          <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={toggleStatus} disabled={statusMutation.isPending}>
            {post.opportunityClosedAt ? "Reopen" : "Close listing"}
          </Button>
        )}
      </div>
    </section>
  );
}
