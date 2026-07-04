"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn, formatDateTime, scoreColor } from "@/lib/utils";
import type { Evaluation } from "@/types/api";
import { FileText, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

interface RecentAnalysesProps {
  evaluations: Evaluation[];
}

const STATUS_CONFIG = {
  completed: { icon: CheckCircle2, label: "Completed", color: "text-emerald-500" },
  processing: { icon: Loader2, label: "Processing", color: "text-blue-500 animate-spin" },
  pending: { icon: Clock, label: "Pending", color: "text-amber-500" },
  failed: { icon: XCircle, label: "Failed", color: "text-red-500" },
} as const;

export function RecentAnalyses({ evaluations }: RecentAnalysesProps) {
  if (evaluations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No analyses yet. Upload your first resume!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {evaluations.slice(0, 8).map((evaluation, i) => {
        const statusCfg = STATUS_CONFIG[evaluation.status];
        const StatusIcon = statusCfg.icon;
        return (
          <motion.div
            key={evaluation.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              href={`/history`}
              className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <StatusIcon className={cn("h-4 w-4 shrink-0", statusCfg.color)} />
                <div>
                  <p className="text-sm font-medium">
                    {evaluation.candidate_name || "Unknown Candidate"}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(evaluation.created_at)}</p>
                </div>
              </div>
              {evaluation.status === "completed" && evaluation.total_score !== null && (
                <div className={cn("text-sm font-bold tabular-nums", scoreColor(evaluation.total_score, 120))}>
                  {evaluation.total_score.toFixed(0)}/120
                </div>
              )}
              {evaluation.status !== "completed" && (
                <Badge variant="outline" className="text-xs">{statusCfg.label}</Badge>
              )}
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
