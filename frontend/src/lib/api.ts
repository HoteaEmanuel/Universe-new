import axios, { AxiosError } from "axios";
import type { HttpClient } from "@universe/shared/api";

// The concrete HttpClient the web app hands to every packages/shared
// api/*.ts factory. Uses the global `axios` default instance (not a
// separate axios.create()) so the existing global interceptors keep
// applying unchanged — in particular
// frontend/src/utils/authInterceptor.ts's 401/ACCOUNT_BLOCKED handler,
// which is registered on `axios.interceptors` directly.
const API_URL =
  import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000/api";
axios.defaults.withCredentials = true;

// Carries the backend's `code`/HTTP status alongside the message, so call
// sites that need to branch on a specific failure (e.g. `USERNAME_TAKEN`)
// don't need to reach back into an axios-shaped `error.response` — going
// through this client instead of raw axios would otherwise have silently
// dropped that information.
export class ApiError extends Error {
  code?: string;
  status?: number;
  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message);
    this.name = "ApiError";
    this.code = options?.code;
    this.status = options?.status;
  }
}

// The old per-store code was inconsistent: some methods threw
// `new Error(error as string)` (a type-cast that doesn't convert
// anything - the message ends up "[object Object]"), others caught the
// error and returned `undefined` instead of rethrowing, silently
// defeating TanStack Query's error state. This throws a proper Error
// with the backend's message when available, always - queries and
// mutations built on top of this client get a real isError/error state
// instead of a silent `undefined`.
const unwrap = (error: unknown, fallback: string): never => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string; code?: string } | undefined;
    throw new ApiError(data?.message ?? fallback, { code: data?.code, status: error.response?.status });
  }
  throw error;
};

export const httpClient: HttpClient = {
  async get(path, params) {
    try {
      const { data } = await axios.get(`${API_URL}${path}`, { params });
      return data;
    } catch (error) {
      return unwrap(error, "Request failed");
    }
  },
  async post(path, body) {
    try {
      const { data } = await axios.post(`${API_URL}${path}`, body);
      return data;
    } catch (error) {
      return unwrap(error, "Request failed");
    }
  },
  async patch(path, body) {
    try {
      const { data } = await axios.patch(`${API_URL}${path}`, body);
      return data;
    } catch (error) {
      return unwrap(error, "Request failed");
    }
  },
  async delete(path) {
    try {
      const { data } = await axios.delete(`${API_URL}${path}`);
      return data;
    } catch (error) {
      return unwrap(error, "Request failed");
    }
  },
  createForm: () => new FormData(),
  async postForm(path, form) {
    try {
      const { data } = await axios.post(`${API_URL}${path}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (error) {
      return unwrap(error, "Request failed");
    }
  },
  async patchForm(path, form) {
    try {
      const { data } = await axios.patch(`${API_URL}${path}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (error) {
      return unwrap(error, "Request failed");
    }
  },
  async putForm(path, form) {
    try {
      const { data } = await axios.put(`${API_URL}${path}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (error) {
      return unwrap(error, "Request failed");
    }
  },
};
