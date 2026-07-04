"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { JobMatchForm } from "@/components/job-match/job-match-form";
import type { JobMatch } from "@/types/api";
import { CheckCircle2, AlertCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

export default function JobMatchPage() {
  const [result, setResult] = useState<JobMatch | null>(null);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Job Match Analysis</h1>
        <p className="text-sm text-muted-foreground">
          Compare your resume against a job description using the hiring-agent engine
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <JobMatchForm onResult={setResult} />
        </CardContent>
      </Card>

      {result && result.evaluation && (
        <div className="space-y-4">
          {/* Overall Score from evaluation */}
          {result.evaluation.total_score !== null && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Evaluation Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className={cn("text-3xl font-bold", {
                    "text-emerald-500": result.evaluation.total_score >= 70,
                    "text-amber-500": result.evaluation.total_score >= 50 && result.evaluation.total_score < 70,
                    "text-red-500": result.evaluation.total_score < 50,
                  })}>
                    {result.evaluation.total_score.toFixed(0)}/120
                  </div>
                  <div className="flex-1">
                    <Progress value={(result.evaluation.total_score / 120) * 100} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Strengths */}
          {result.evaluation.key_strengths && result.evaluation.key_strengths.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Strengths for This Role
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {result.evaluation.key_strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Areas for improvement */}
          {result.evaluation.areas_for_improvement && result.evaluation.areas_for_improvement.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Gaps to Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {result.evaluation.areas_for_improvement.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      {a}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Category scores for this JD */}
          {result.evaluation.scores && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Category Scores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(result.evaluation.scores).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{key.replace("_", " ")}</span>
                      <span className="font-medium">{val.score}/{val.max}</span>
                    </div>
                    <Progress value={(val.score / val.max) * 100} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
