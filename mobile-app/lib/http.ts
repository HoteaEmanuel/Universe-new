import { AxiosError } from "axios";
import type { HttpClient } from "@universe/shared/api";
import api from "../utils/api.js";

// The concrete HttpClient every packages/shared api/*.ts factory is handed
// on mobile. Wraps the existing `utils/api.js` axios instance so its
// request interceptor (bearer token from SecureStore) and response
// interceptor (refresh-on-401, see utils/api.js) keep applying unchanged —
// mirrors frontend/src/lib/api.ts, which does the same for the web app's
// axios instance and its cookie-based interceptor.
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
      const { data } = await api.get(path, { params });
      return data;
    } catch (error) {
      return unwrap(error, "Request failed");
    }
  },
  async post(path, body) {
    try {
      const { data } = await api.post(path, body);
      return data;
    } catch (error) {
      return unwrap(error, "Request failed");
    }
  },
  async patch(path, body) {
    try {
      const { data } = await api.patch(path, body);
      return data;
    } catch (error) {
      return unwrap(error, "Request failed");
    }
  },
  async delete(path) {
    try {
      const { data } = await api.delete(path);
      return data;
    } catch (error) {
      return unwrap(error, "Request failed");
    }
  },
  createForm: () => new FormData(),
  async postForm(path, form) {
    try {
      const { data } = await api.post(path, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (error) {
      return unwrap(error, "Request failed");
    }
  },
  async patchForm(path, form) {
    try {
      const { data } = await api.patch(path, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (error) {
      return unwrap(error, "Request failed");
    }
  },
  async putForm(path, form) {
    try {
      const { data } = await api.put(path, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (error) {
      return unwrap(error, "Request failed");
    }
  },
};
