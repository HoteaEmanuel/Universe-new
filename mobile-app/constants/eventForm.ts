// Mirrors frontend/src/constants/eventForm.ts's numeric limits, plus a
// title cap matching the post-title convention (constants/postForm.ts) —
// events have no equivalent limit on web, which only enforces a minLength.
export const EVENT_TITLE_MAX_LENGTH = 100;
export const EVENT_DESCRIPTION_MAX_LENGTH = 2200;
export const EVENT_LOCATION_MAX_LENGTH = 150;
