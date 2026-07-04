"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { Evaluation } from "@/types/api";
import { formatDate } from "@/lib/utils";

interface ScoreTimelineProps {
  evaluations: Evaluation[];
}

export function ScoreTimeline({ evaluations }: ScoreTimelineProps) {
  const data = [...evaluations]
    .reverse()
    .map((e, i) => ({
      date: formatDate(e.created_at),
      score: e.total_score ?? 0,
      index: i + 1,
    }));

  if (data.length < 2) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Upload more resumes to see score progression
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
        <YAxis domain={[0, 120]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          formatter={(v: number) => [v.toFixed(1), "Score"]}
        />
        <ReferenceLine y={70} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "Strong", fontSize: 10 }} />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#6366f1"
          strokeWidth={2.5}
          dot={{ fill: "#6366f1", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
