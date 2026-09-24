
export type AccountType = "normal" | "business";
export type UserRole = "user" | "admin";

export type GroupVisibility = "public" | "private";
export type GroupRole = "member" | "admin";

export type NotificationType =
  | "post-like"
  | "post-comment"
  | "post-reply"
  | "comment-like"
  | "follow"
  | "message"
  | "event-update"
  | "event-cancelled"
  | "event-waitlist-promoted"
  | "event-invite"
  | "event-banned"
  | "group-banned"
  | "post-mention"
  | "comment-mention"
  | "content-removed";

export type EventVisibility = "public" | "private";
export type EventParticipantStatus =
  | "going"
  | "interested"
  | "waitlisted"
  | "invited";
export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";
export type EventType = "community" | "official";

export type PollStatus = "open" | "closed";

export type PostType = "standard" | "opportunity";
export type OpportunityType =
  | "internship"
  | "part_time"
  | "full_time"
  | "graduate_program"
  | "volunteering"
  | "campus_ambassador";
export type WorkplaceType = "onsite" | "hybrid" | "remote";

export type ResourceCategory =
  | "lecture_notes"
  | "assignment"
  | "exam_prep"
  | "link"
  | "recording"
  | "other";

export type ReportTargetType = "user_profile" | "post" | "comment";
export type ReportReason =
  | "spam"
  | "harassment_or_bullying"
  | "hate_speech"
  | "nudity_or_sexual_content"
  | "violence_or_dangerous_content"
  | "misinformation"
  | "impersonation"
  | "self_harm_or_suicide"
  | "intellectual_property"
  | "other";
export type ReportStatus = "pending" | "resolved" | "dismissed";
export type ReportAction = "none" | "content_removed" | "user_blocked";
export type ReportResolveAction = "dismiss" | "remove_content" | "block_user";
