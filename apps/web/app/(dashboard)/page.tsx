"use client";
import { motion } from "framer-motion";
import { useEvaluations } from "@/hooks/use-evaluations";
import { useResumes } from "@/hooks/use-resumes";
import { useAuthStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScoreOverview } from "@/components/dashboard/score-overview";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { ScoreRadarChart } from "@/components/dashboard/radar-chart";
import { ScoreTimeline } from "@/components/dashboard/score-timeline";
import { StrengthsWeaknesses } from "@/components/dashboard/strengths-weaknesses";
import { GitHubSummary } from "@/components/dashboard/github-summary";
import { RecentAnalyses } from "@/components/dashboard/recent-analyses";
import Link from "next/link";
import { Upload, FileText } from "lucide-react";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: evaluationsData, isLoading: evalsLoading } = useEvaluations();
  const { data: resumesData, isLoading: resumesLoading } = useResumes();

  const evaluations = evaluationsData?.evaluations ?? [];
  const completedEvals = evaluations.filter((e) => e.status === "completed");
  const latestEval = completedEvals[0] ?? null;
  const previousEval = completedEvals[1] ?? null;

  const isLoading = evalsLoading || resumesLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!latestEval) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-3"
        >
          <FileText className="mx-auto h-16 w-16 text-muted-foreground/40" />
          <h2 className="text-xl font-semibold">Welcome to ResumeScore{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}!</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Upload your resume to get a detailed AI-powered evaluation using the interviewstreet hiring-agent engine.
          </p>
          <Link href="/upload">
            <Button size="lg" className="mt-2">
              <Upload className="mr-2 h-4 w-4" />
              Upload Resume
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {latestEval.candidate_name ? `Latest evaluation for ${latestEval.candidate_name}` : "Your latest evaluation"}
        </p>
      </motion.div>

      {/* Top row: score + radar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center p-6">
          <ScoreOverview
            evaluation={latestEval}
            previousScore={previousEval?.total_score}
          />
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Score Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreRadarChart evaluation={latestEval} />
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown */}
      <div>
        <h2 className="mb-3 text-sm font-semibold">Category Breakdown</h2>
        <CategoryBreakdown evaluation={latestEval} />
      </div>

      {/* Strengths / Weaknesses */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <StrengthsWeaknesses evaluation={latestEval} />
        </CardContent>
      </Card>

      {/* GitHub + Timeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {latestEval.github_data && Object.keys(latestEval.github_data).length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">GitHub Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <GitHubSummary githubData={latestEval.github_data} />
            </CardContent>
          </Card>
        )}

        {evaluations.length >= 2 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Score Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreTimeline evaluations={completedEvals} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent analyses */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Recent Analyses</CardTitle>
            <Link href="/history">
              <Button variant="ghost" size="sm" className="text-xs">View all</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <RecentAnalyses evaluations={evaluations} />
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-48" />
      <div className="grid grid-cols-3 gap-6">
        <Skeleton className="h-60" />
        <Skeleton className="col-span-2 h-60" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
    </div>
  );
}
