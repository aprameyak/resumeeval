"use client";
import { motion } from "framer-motion";
import { cn, scoreColor } from "@/lib/utils";
import type { CompareResult } from "@/types/api";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface ComparisonViewProps {
  result: CompareResult;
}

export function ComparisonView({ result }: ComparisonViewProps) {
  const { evaluation_a, evaluation_b, total_score_diff, category_diffs, new_strengths, regressions } = result;

  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <div className="grid grid-cols-3 gap-4">
        <ScoreCard label="Resume A" score={evaluation_a.total_score ?? 0} name={evaluation_a.candidate_name} />
        <DiffCard diff={total_score_diff} />
        <ScoreCard label="Resume B" score={evaluation_b.total_score ?? 0} name={evaluation_b.candidate_name} />
      </div>

      {/* Category Diffs */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Category Comparison</h3>
        {category_diffs.map((diff, i) => (
          <motion.div
            key={diff.category}
            className="space-y-1"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{diff.category}</span>
              <span className={cn("flex items-center gap-1 text-xs font-semibold", {
                "text-emerald-500": diff.diff > 0,
                "text-red-500": diff.diff < 0,
                "text-muted-foreground": diff.diff === 0,
              })}>
                {diff.diff > 0 ? <TrendingUp className="h-3 w-3" /> : diff.diff < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                {diff.diff > 0 ? "+" : ""}{diff.diff.toFixed(1)}
              </span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 space-y-0.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>A</span><span>{diff.score_a.toFixed(1)}/{diff.max}</span>
                </div>
                <Progress value={(diff.score_a / diff.max) * 100} className="h-1" />
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>B</span><span>{diff.score_b.toFixed(1)}/{diff.max}</span>
                </div>
                <Progress value={(diff.score_b / diff.max) * 100} className="h-1" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* New Strengths / Regressions */}
      {(new_strengths.length > 0 || regressions.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {new_strengths.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold text-emerald-600">New Strengths in B</h4>
              {new_strengths.map((s, i) => (
                <Badge key={i} variant="success" className="mb-1 mr-1 text-xs">{s}</Badge>
              ))}
            </div>
          )}
          {regressions.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold text-red-600">Lost from A</h4>
              {regressions.map((r, i) => (
                <Badge key={i} variant="destructive" className="mb-1 mr-1 text-xs">{r}</Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreCard({ label, score, name }: { label: string; score: number; name?: string | null }) {
  return (
    <div className="rounded-xl border bg-card p-4 text-center">
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className={cn("text-2xl font-bold", scoreColor(score, 120))}>{score.toFixed(0)}</div>
      <div className="text-xs text-muted-foreground">/120</div>
      {name && <div className="mt-1 truncate text-xs font-medium">{name}</div>}
    </div>
  );
}

function DiffCard({ diff }: { diff: number }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-4">
      <div className="text-xs text-muted-foreground mb-1">Difference</div>
      <div className={cn("flex items-center gap-1 text-xl font-bold", {
        "text-emerald-500": diff > 0,
        "text-red-500": diff < 0,
        "text-muted-foreground": diff === 0,
      })}>
        {diff > 0 ? <TrendingUp className="h-5 w-5" /> : diff < 0 ? <TrendingDown className="h-5 w-5" /> : null}
        {diff > 0 ? "+" : ""}{diff.toFixed(1)}
      </div>
    </div>
  );
}
