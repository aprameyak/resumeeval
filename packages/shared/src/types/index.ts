// Shared TypeScript types for ResumeScore

export const SCORE_CATEGORIES = {
  open_source: { label: "Open Source", max: 35 },
  self_projects: { label: "Self Projects", max: 30 },
  production: { label: "Production", max: 25 },
  technical_skills: { label: "Technical Skills", max: 10 },
} as const;

export type ScoreCategory = keyof typeof SCORE_CATEGORIES;

export const MAX_BONUS_POINTS = 20;
export const MAX_BASE_SCORE = 100;
export const MAX_TOTAL_SCORE = 120;

export interface CategoryScore {
  score: number;
  max: number;
  evidence?: string | null;
}

export interface EvaluationScores {
  open_source: CategoryScore;
  self_projects: CategoryScore;
  production: CategoryScore;
  technical_skills: CategoryScore;
}

export function computeTotalScore(
  scores: EvaluationScores,
  bonusTotal: number,
  deductionsTotal: number
): number {
  const base =
    scores.open_source.score +
    scores.self_projects.score +
    scores.production.score +
    scores.technical_skills.score;
  return base + bonusTotal - deductionsTotal;
}

export function getScoreGrade(total: number): string {
  if (total >= 90) return "Exceptional";
  if (total >= 70) return "Strong";
  if (total >= 50) return "Good";
  if (total >= 30) return "Fair";
  return "Needs Work";
}
