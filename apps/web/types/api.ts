// TypeScript types mirroring the FastAPI schemas + hiring-agent output

export interface CategoryScore {
  score: number;
  max: number;
  evidence: string | null;
}

export interface Scores {
  open_source: CategoryScore;
  self_projects: CategoryScore;
  production: CategoryScore;
  technical_skills: CategoryScore;
}

export interface BonusPoints {
  total: number;
  breakdown: string | null;
}

export interface Deductions {
  total: number;
  reasons: string | null;
}

export type EvaluationStatus = "pending" | "processing" | "completed" | "failed";
export type ResumeStatus = "pending" | "processing" | "completed" | "failed";

export interface Evaluation {
  id: string;
  resume_id: string;
  candidate_name: string | null;
  status: EvaluationStatus;
  error_message: string | null;
  scores: Scores | null;
  bonus_points: BonusPoints | null;
  deductions: Deductions | null;
  total_score: number | null;
  key_strengths: string[];
  areas_for_improvement: string[];
  github_data: GitHubData | null;
  job_description: string | null;
  created_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  original_filename: string;
  file_size: number;
  content_type: string;
  status: ResumeStatus;
  parsed_data: ParsedResume | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParsedResume {
  basics?: {
    name?: string;
    email?: string;
    phone?: string;
    url?: string;
    summary?: string;
    profiles?: Array<{ network: string; username: string; url?: string }>;
  };
  work?: Array<{
    name: string;
    position: string;
    startDate?: string;
    endDate?: string;
    summary?: string;
    highlights?: string[];
  }>;
  education?: Array<{
    institution: string;
    area?: string;
    studyType?: string;
    startDate?: string;
    endDate?: string;
  }>;
  skills?: Array<{ name: string; keywords?: string[] }>;
  projects?: Array<{
    name: string;
    description?: string;
    url?: string;
    technologies?: string[];
  }>;
}

export interface GitHubProfile {
  login: string;
  name?: string;
  bio?: string;
  followers?: number;
  following?: number;
  public_repos?: number;
  avatar_url?: string;
  html_url?: string;
  created_at?: string;
}

export interface GitHubRepo {
  name: string;
  description?: string;
  html_url?: string;
  stargazers_count?: number;
  language?: string;
  fork?: boolean;
  author_commit_count?: number;
  is_open_source?: boolean;
}

export interface GitHubData {
  profile?: GitHubProfile;
  projects?: GitHubRepo[];
  open_source_projects?: GitHubRepo[];
  self_projects?: GitHubRepo[];
  total_repos?: number;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  github_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface JobMatch {
  id: string;
  resume_id: string;
  job_title: string | null;
  company: string | null;
  job_description: string;
  match_percentage: number | null;
  missing_skills: string[];
  missing_experience: string[];
  keyword_coverage: number | null;
  recommendations: string[];
  evaluation: Evaluation | null;
  created_at: string;
}

export interface CategoryDiff {
  category: string;
  score_a: number;
  score_b: number;
  diff: number;
  max: number;
}

export interface CompareResult {
  evaluation_a: Evaluation;
  evaluation_b: Evaluation;
  total_score_diff: number;
  category_diffs: CategoryDiff[];
  new_strengths: string[];
  regressions: string[];
}

export interface ResumeListResponse {
  resumes: Resume[];
  total: number;
}

export interface EvaluationListResponse {
  evaluations: Evaluation[];
  total: number;
}

// Score weight constants (mirrors hiring-agent)
export const SCORE_WEIGHTS = {
  open_source: { max: 35, label: "Open Source" },
  self_projects: { max: 30, label: "Self Projects" },
  production: { max: 25, label: "Production" },
  technical_skills: { max: 10, label: "Technical Skills" },
} as const;

export const MAX_BONUS = 20;
export const MAX_TOTAL_SCORE = 120;
