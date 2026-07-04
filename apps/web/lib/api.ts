/**
 * Typed API client for the ResumeScore FastAPI backend.
 * All calls go through axios with auth interceptors.
 */
import axios, { type AxiosError } from "axios";
import type {
  AuthTokens,
  User,
  Resume,
  ResumeListResponse,
  Evaluation,
  EvaluationListResponse,
  CompareResult,
  JobMatch,
} from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120_000, // 2 min — evaluations can take a while
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach Bearer token ──────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response interceptor: handle 401 → refresh ───────────────────────────────
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshSubscribers.push((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          });
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) throw new Error("No refresh token");
        const { data } = await axios.post<AuthTokens>(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        refreshSubscribers.forEach((cb) => cb(data.access_token));
        refreshSubscribers = [];
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        }
        return api(originalRequest);
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; full_name?: string }) =>
    api.post<AuthTokens>("/auth/register", data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthTokens>("/auth/login", data).then((r) => r.data),

  logout: () => api.post("/auth/logout"),

  me: () => api.get<User>("/auth/me").then((r) => r.data),

  updateProfile: (data: { full_name?: string; github_url?: string }) =>
    api.patch<User>("/auth/me", data).then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),

  resetPassword: (token: string, new_password: string) =>
    api.post("/auth/reset-password", { token, new_password }),
};

// ── Resumes ───────────────────────────────────────────────────────────────────
export const resumesApi = {
  upload: (file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post<Resume>("/resumes/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      })
      .then((r) => r.data);
  },

  list: (skip = 0, limit = 50) =>
    api.get<ResumeListResponse>("/resumes", { params: { skip, limit } }).then((r) => r.data),

  get: (id: string) => api.get<Resume>(`/resumes/${id}`).then((r) => r.data),

  delete: (id: string) => api.delete(`/resumes/${id}`),

  getEvaluations: (resumeId: string) =>
    api.get<Evaluation[]>(`/resumes/${resumeId}/evaluations`).then((r) => r.data),
};

// ── Evaluations ───────────────────────────────────────────────────────────────
export const evaluationsApi = {
  list: (skip = 0, limit = 50) =>
    api.get<EvaluationListResponse>("/evaluations", { params: { skip, limit } }).then((r) => r.data),

  get: (id: string) => api.get<Evaluation>(`/evaluations/${id}`).then((r) => r.data),

  trigger: (resumeId: string) =>
    api.post<Evaluation>(`/evaluations/trigger/${resumeId}`).then((r) => r.data),

  compare: (idA: string, idB: string) =>
    api
      .post<CompareResult>("/evaluations/compare", {
        evaluation_id_a: idA,
        evaluation_id_b: idB,
      })
      .then((r) => r.data),

  jobMatch: (data: {
    resume_id: string;
    job_description: string;
    job_title?: string;
    company?: string;
  }) => api.post<JobMatch>("/evaluations/job-match", data).then((r) => r.data),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  download: async (evaluationId: string, candidateName: string) => {
    const response = await api.get(`/reports/${evaluationId}/download`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `resumescore_${candidateName}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
