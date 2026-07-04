import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function scoreColor(score: number, max: number): string {
  const pct = max > 0 ? score / max : 0;
  if (pct >= 0.75) return "text-emerald-500";
  if (pct >= 0.5) return "text-amber-500";
  return "text-red-500";
}

export function scoreBg(score: number, max: number): string {
  const pct = max > 0 ? score / max : 0;
  if (pct >= 0.75) return "bg-emerald-500";
  if (pct >= 0.5) return "bg-amber-500";
  return "bg-red-500";
}

export function scoreGrade(totalScore: number): string {
  if (totalScore >= 90) return "Exceptional";
  if (totalScore >= 70) return "Strong";
  if (totalScore >= 50) return "Good";
  if (totalScore >= 30) return "Fair";
  return "Needs Work";
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "…";
}
