"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEvaluations } from "@/hooks/use-evaluations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreOverview } from "@/components/dashboard/score-overview";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { StrengthsWeaknesses } from "@/components/dashboard/strengths-weaknesses";
import { GitHubSummary } from "@/components/dashboard/github-summary";
import { reportsApi } from "@/lib/api";
import { formatDateTime, cn, scoreColor } from "@/lib/utils";
import { CheckCircle2, Loader2, Clock, XCircle, Download, ChevronDown, ChevronUp } from "lucide-react";
import type { Evaluation } from "@/types/api";
import { toast } from "sonner";

export default function HistoryPage() {
  const { data, isLoading } = useEvaluations();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const evaluations = data?.evaluations ?? [];

  const handleDownload = async (evaluation: Evaluation) => {
    if (evaluation.status !== "completed") return;
    setDownloading(evaluation.id);
    try {
      await reportsApi.download(evaluation.id, evaluation.candidate_name || "resume");
    } catch {
      toast.error("Failed to download report");
    } finally {
      setDownloading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">History</h1>
        <p className="text-sm text-muted-foreground">{evaluations.length} evaluation{evaluations.length !== 1 ? "s" : ""}</p>
      </div>

      {evaluations.length === 0 && (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          No evaluations yet. Upload a resume to get started.
        </div>
      )}

      <div className="space-y-2">
        {evaluations.map((evaluation) => (
          <Card key={evaluation.id} className="overflow-hidden">
            <div
              className="flex cursor-pointer items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
              onClick={() => setExpanded(expanded === evaluation.id ? null : evaluation.id)}
            >
              <StatusIcon status={evaluation.status} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{evaluation.candidate_name || "Unknown Candidate"}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(evaluation.created_at)}</p>
              </div>
              {evaluation.status === "completed" && evaluation.total_score !== null && (
                <span className={cn("text-base font-bold tabular-nums shrink-0", scoreColor(evaluation.total_score, 120))}>
                  {evaluation.total_score.toFixed(0)}/120
                </span>
              )}
              {evaluation.status !== "completed" && (
                <Badge variant="outline" className="text-xs capitalize shrink-0">{evaluation.status}</Badge>
              )}
              {evaluation.status === "completed" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={(e) => { e.stopPropagation(); handleDownload(evaluation); }}
                  disabled={downloading === evaluation.id}
                  title="Download PDF report"
                >
                  {downloading === evaluation.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
              {expanded === evaluation.id ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </div>

            <AnimatePresence>
              {expanded === evaluation.id && evaluation.status === "completed" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden border-t"
                >
                  <div className="p-4 space-y-6">
                    <div className="flex gap-6 flex-wrap">
                      <ScoreOverview evaluation={evaluation} />
                    </div>
                    <CategoryBreakdown evaluation={evaluation} />
                    <StrengthsWeaknesses evaluation={evaluation} />
                    {evaluation.github_data && Object.keys(evaluation.github_data).length > 0 && (
                      <GitHubSummary githubData={evaluation.github_data} />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
  if (status === "processing") return <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />;
  if (status === "failed") return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
  return <Clock className="h-4 w-4 text-amber-500 shrink-0" />;
}
