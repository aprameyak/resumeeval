"use client";
import { motion } from "framer-motion";
import { cn, scoreGrade } from "@/lib/utils";
import type { Evaluation } from "@/types/api";
import { MAX_TOTAL_SCORE } from "@/types/api";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ScoreOverviewProps {
  evaluation: Evaluation;
  previousScore?: number | null;
}

export function ScoreOverview({ evaluation, previousScore }: ScoreOverviewProps) {
  const total = evaluation.total_score ?? 0;
  const percentage = (total / MAX_TOTAL_SCORE) * 100;
  const circumference = 2 * Math.PI * 54; // r=54
  const offset = circumference - (percentage / 100) * circumference;
  const grade = scoreGrade(total);

  const diff = previousScore != null ? total - previousScore : null;

  const strokeColor =
    percentage >= 75 ? "#22c55e" : percentage >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-36 w-36">
        <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
          {/* Track */}
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-muted"
          />
          {/* Fill */}
          <motion.circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke={strokeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-bold tabular-nums"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            {total.toFixed(0)}
          </motion.span>
          <span className="text-xs text-muted-foreground">/ {MAX_TOTAL_SCORE}</span>
        </div>
      </div>

      <div className="text-center">
        <div className={cn("text-lg font-semibold", {
          "text-emerald-500": percentage >= 75,
          "text-amber-500": percentage >= 50 && percentage < 75,
          "text-red-500": percentage < 50,
        })}>
          {grade}
        </div>
        {diff !== null && (
          <div className={cn("flex items-center gap-1 text-sm", {
            "text-emerald-500": diff > 0,
            "text-red-500": diff < 0,
            "text-muted-foreground": diff === 0,
          })}>
            {diff > 0 ? <TrendingUp className="h-3.5 w-3.5" /> :
             diff < 0 ? <TrendingDown className="h-3.5 w-3.5" /> :
             <Minus className="h-3.5 w-3.5" />}
            <span>{diff > 0 ? "+" : ""}{diff.toFixed(1)} from last</span>
          </div>
        )}
      </div>

      {/* Bonus / Deductions */}
      {(evaluation.bonus_points || evaluation.deductions) && (
        <div className="flex gap-4 text-xs text-muted-foreground">
          {evaluation.bonus_points && evaluation.bonus_points.total > 0 && (
            <span className="text-emerald-500">+{evaluation.bonus_points.total} bonus</span>
          )}
          {evaluation.deductions && evaluation.deductions.total > 0 && (
            <span className="text-red-500">-{evaluation.deductions.total} deductions</span>
          )}
        </div>
      )}
    </div>
  );
}
