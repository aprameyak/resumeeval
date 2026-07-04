"use client";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Evaluation } from "@/types/api";
import { SCORE_WEIGHTS } from "@/types/api";

interface ScoreRadarChartProps {
  evaluation: Evaluation;
  comparison?: Evaluation;
}

export function ScoreRadarChart({ evaluation, comparison }: ScoreRadarChartProps) {
  if (!evaluation.scores) return null;

  const data = (Object.entries(SCORE_WEIGHTS) as [keyof typeof SCORE_WEIGHTS, any][]).map(
    ([key, meta]) => ({
      category: meta.label,
      score: Math.round((evaluation.scores![key].score / meta.max) * 100),
      ...(comparison?.scores
        ? { compare: Math.round((comparison.scores[key].score / meta.max) * 100) }
        : {}),
    })
  );

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            color: "hsl(var(--popover-foreground))",
          }}
          formatter={(value: number) => [`${value}%`, ""]}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        {comparison?.scores && (
          <Radar
            name="Compare"
            dataKey="compare"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        )}
      </RadarChart>
    </ResponsiveContainer>
  );
}
