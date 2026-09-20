import type { ReportAction, ReportReason, ReportResolveAction, ReportStatus, ReportTargetType } from "./domain.js";
import type { ReportUserSummary } from "./user.js";
import type { NamedCursorPage } from "./pagination.js";

export type PostReportSnapshot = {
  title?: string | null;
  body?: string | null;
  imagesUrls?: string[];
  authorUsername: string;
};

export type CommentReportSnapshot = {
  text: string;
  authorUsername: string;
  postId: string;
};

export type ProfileReportSnapshot = {
  username: string;
  name?: string | null;
  bio?: string | null;
  profilePicture?: string | null;
};

export type Report = {
  id: string;
  reporterId: string | null;
  reporterUsername: string;
  reporter: ReportUserSummary | null;
  reportedUserId: string;
  reportedUser: ReportUserSummary;
  targetType: ReportTargetType;
  postId: string | null;
  commentId: string | null;
  targetSnapshot:
    | PostReportSnapshot
    | CommentReportSnapshot
    | ProfileReportSnapshot
    | null;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  action: ReportAction;
  reviewedByUserId: string | null;
  reviewedBy: ReportUserSummary | null;
  reviewedAt: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReportsPage = NamedCursorPage<"reports", Report>;

export type ReportedUserSummaryRow = {
  user: ReportUserSummary;
  pendingCount: number;
  lastReportedAt: string;
};

export type CreateReportPayload =
  | {
      targetType: "post";
      postId: string;
      reason: ReportReason;
      details?: string;
      alsoBlock?: boolean;
    }
  | {
      targetType: "comment";
      commentId: string;
      reason: ReportReason;
      details?: string;
      alsoBlock?: boolean;
    }
  | {
      targetType: "user_profile";
      reportedUserId: string;
      reason: ReportReason;
      details?: string;
      alsoBlock?: boolean;
    };

export const REPORT_REASON_OPTIONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "harassment_or_bullying", label: "Harassment or bullying" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "nudity_or_sexual_content", label: "Nudity or sexual content" },
  { value: "violence_or_dangerous_content", label: "Violence or dangerous content" },
  { value: "misinformation", label: "Misinformation" },
  { value: "impersonation", label: "Impersonation" },
  { value: "self_harm_or_suicide", label: "Self-harm or suicide" },
  { value: "intellectual_property", label: "Intellectual property violation" },
  { value: "other", label: "Other" },
];

export const REPORT_STATUS_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

export const REPORT_TARGET_TYPE_OPTIONS: { value: ReportTargetType; label: string }[] = [
  { value: "post", label: "Post" },
  { value: "comment", label: "Comment" },
  { value: "user_profile", label: "Profile" },
];

export type { ReportResolveAction };
