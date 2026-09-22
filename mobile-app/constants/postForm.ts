// Mirrors frontend/src/constants/postForm.ts's numeric limits (kept local
// rather than promoted to packages/shared since it's four plain numbers,
// not shared behavior) plus the mobile-only image cap, matching web's
// MultipleImagesUploader default.
export const TITLE_MAX_LENGTH = 100;
export const BODY_MAX_LENGTH = 2200;
export const LOCATION_MAX_LENGTH = 100;
export const TAGS_MAX_LENGTH = 100;
export const MAX_IMAGES = 10;
