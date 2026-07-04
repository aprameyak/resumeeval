"use client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn, scoreColor } from "@/lib/utils";
import type { Evaluation } from "@/types/api";
import { SCORE_WEIGHTS } from "@/types/api";
import { GitBranch, FolderGit2, Briefcase, Code2 } from "lucide-react";

const CATEGORY_ICONS = {
  open_source: GitBranch,
  self_projects: FolderGit2,
  production: Briefcase,
  technical_skills: Code2,
} as const;

interface CategoryBreakdownProps {
  evaluation: Evaluation;
}

export function CategoryBreakdown({ evaluation }: CategoryBreakdownProps) {
  if (!evaluation.scores) return null;

  const categories = (
    Object.entries(SCORE_WEIGHTS) as [keyof typeof SCORE_WEIGHTS, (typeof SCORE_WEIGHTS)[keyof typeof SCORE_WEIGHTS]][]
  ).map(([key, meta]) => {
    const score = evaluation.scores![key];
    const Icon = CATEGORY_ICONS[key];
    return { key, label: meta.label, max: meta.max, score: score.score, evidence: score.evidence, Icon };
  });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {categories.map(({ key, label, max, score, evidence, Icon }, i) => {
        const pct = (score / max) * 100;
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {label}
                  </div>
                  <span className={cn("text-base font-bold", scoreColor(score, max))}>
                    {score.toFixed(1)}/{max}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={pct} className="h-1.5" />
                {evidence && (
                  <p className="text-xs text-muted-foreground line-clamp-3">{evidence}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
