// The narrow interface every api/*.ts module is written against, instead of
// importing axios (or anything else) directly. Each platform supplies its
// own implementation:
//  - web: wraps the existing shared `axios` default instance (cookies,
//    withCredentials, the global 401/ACCOUNT_BLOCKED interceptor already
//    registered in frontend/src/utils/authInterceptor.ts keep working
//    unchanged since it's registered on the same global axios instance).
//  - mobile: wraps `app/utils/api.js`'s axios instance, adding the bearer
//    token from SecureStore and a refresh-on-401 interceptor (Phase 2).
//
// `createForm`/`postForm`/`patchForm` exist because multipart upload needs
// a real `FormData`, which this package can't reference directly (no DOM
// lib — see packages/shared/tsconfig.json). The platform's client supplies
// a `FormData`-shaped factory; the field-building logic for each payload
// (which keys, what's conditional) lives once in api/*.ts instead of being
// duplicated per platform, which is exactly where the mobile app's
// `post._id`/`post.caption` drift against the current backend came from.

export type QueryParams = Record<string, string | number | boolean | undefined>;

/** Structurally compatible with both DOM `FormData` and React Native's global `FormData`. */
export type FormDataLike = {
  append(name: string, value: unknown, fileName?: string): void;
};

export type HttpClient = {
  get<T>(path: string, params?: QueryParams): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
  createForm(): FormDataLike;
  postForm<T>(path: string, form: FormDataLike): Promise<T>;
  patchForm<T>(path: string, form: FormDataLike): Promise<T>;
};
