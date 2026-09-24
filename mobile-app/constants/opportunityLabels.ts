import type { OpportunityType, WorkplaceType } from "@universe/shared";

// Mirrors the hardcoded LABELS map in
// frontend/src/features/opportunities/components/OpportunitySummary.tsx and
// the OPPORTUNITY_TYPES list in frontend/src/constants/postForm.ts, merged
// into one source both the opportunities screen and the create-post form
// pull from on mobile.
export const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, string> = {
  internship: "Internship",
  part_time: "Part-time",
  full_time: "Full-time",
  graduate_program: "Graduate program",
  volunteering: "Volunteering",
  campus_ambassador: "Campus ambassador",
};

export const WORKPLACE_TYPE_LABELS: Record<WorkplaceType, string> = {
  onsite: "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

export const OPPORTUNITY_TYPES: { value: OpportunityType; label: string }[] = [
  { value: "internship", label: OPPORTUNITY_TYPE_LABELS.internship },
  { value: "part_time", label: OPPORTUNITY_TYPE_LABELS.part_time },
  { value: "full_time", label: OPPORTUNITY_TYPE_LABELS.full_time },
  { value: "graduate_program", label: OPPORTUNITY_TYPE_LABELS.graduate_program },
  { value: "volunteering", label: OPPORTUNITY_TYPE_LABELS.volunteering },
  { value: "campus_ambassador", label: OPPORTUNITY_TYPE_LABELS.campus_ambassador },
];

export const WORKPLACE_TYPES: { value: WorkplaceType; label: string }[] = [
  { value: "onsite", label: WORKPLACE_TYPE_LABELS.onsite },
  { value: "hybrid", label: WORKPLACE_TYPE_LABELS.hybrid },
  { value: "remote", label: WORKPLACE_TYPE_LABELS.remote },
];
