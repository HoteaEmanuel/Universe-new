import type { OpportunityType } from "@/queryAndMutation/types";

export const TITLE_MAX_LENGTH = 100;
export const BODY_MAX_LENGTH = 2200;
export const LOCATION_MAX_LENGTH = 100;
export const TAGS_MAX_LENGTH = 100;

export const OPPORTUNITY_TYPES: { value: OpportunityType; label: string }[] = [
  { value: "internship", label: "Internship" },
  { value: "part_time", label: "Part-time job" },
  { value: "full_time", label: "Full-time job" },
  { value: "graduate_program", label: "Graduate program" },
  { value: "volunteering", label: "Volunteering" },
  { value: "campus_ambassador", label: "Campus ambassador" },
];
