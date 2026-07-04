"use client";
import { useState } from "react";
import { useEvaluations, useCompare } from "@/hooks/use-evaluations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ComparisonView } from "@/components/compare/comparison-view";
import { ScoreRadarChart } from "@/components/dashboard/radar-chart";
import { Loader2, GitCompare } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { CompareResult } from "@/types/api";

export default function ComparePage() {
  const { data } = useEvaluations();
  const compareMutation = useCompare();
  const [idA, setIdA] = useState("");
  const [idB, setIdB] = useState("");
  const [result, setResult] = useState<CompareResult | null>(null);

  const completedEvals = (data?.evaluations ?? []).filter((e) => e.status === "completed");

  const handleCompare = async () => {
    if (!idA || !idB || idA === idB) return;
    const res = await compareMutation.mutateAsync({ idA, idB });
    setResult(res);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Compare Evaluations</h1>
        <p className="text-sm text-muted-foreground">Select two completed evaluations to compare side-by-side</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Resume A</Label>
              <select
                value={idA}
                onChange={(e) => setIdA(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="">Select evaluation…</option>
                {completedEvals.map((e) => (
                  <option key={e.id} value={e.id} disabled={e.id === idB}>
                    {e.candidate_name || "Unknown"} · {e.total_score?.toFixed(0)}/120 · {formatDateTime(e.created_at)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Resume B</Label>
              <select
                value={idB}
                onChange={(e) => setIdB(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="">Select evaluation…</option>
                {completedEvals.map((e) => (
                  <option key={e.id} value={e.id} disabled={e.id === idA}>
                    {e.candidate_name || "Unknown"} · {e.total_score?.toFixed(0)}/120 · {formatDateTime(e.created_at)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            className="mt-4 w-full"
            disabled={!idA || !idB || idA === idB || compareMutation.isPending}
            onClick={handleCompare}
          >
            {compareMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Comparing…</>
            ) : (
              <><GitCompare className="mr-2 h-4 w-4" />Compare</>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Comparison Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ComparisonView result={result} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Radar Overlay</CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreRadarChart evaluation={result.evaluation_a} comparison={result.evaluation_b} />
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground justify-center">
                <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-brand-500" />Resume A</span>
                <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-amber-500" />Resume B</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
