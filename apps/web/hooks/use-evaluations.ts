"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { evaluationsApi } from "@/lib/api";
import { toast } from "sonner";

export function useEvaluations() {
  return useQuery({
    queryKey: ["evaluations"],
    queryFn: () => evaluationsApi.list(),
  });
}

export function useEvaluation(id: string) {
  return useQuery({
    queryKey: ["evaluations", id],
    queryFn: () => evaluationsApi.get(id),
    enabled: !!id,
    // Poll while pending/processing
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "pending" || status === "processing") return 3000;
      return false;
    },
  });
}

export function useTriggerEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: evaluationsApi.trigger,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["evaluations"] });
      toast.success("Evaluation started");
    },
    onError: () => {
      toast.error("Failed to trigger evaluation");
    },
  });
}

export function useCompare() {
  return useMutation({
    mutationFn: ({ idA, idB }: { idA: string; idB: string }) =>
      evaluationsApi.compare(idA, idB),
    onError: () => {
      toast.error("Comparison failed");
    },
  });
}

export function useJobMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: evaluationsApi.jobMatch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["evaluations"] });
      toast.success("Job match analysis started");
    },
    onError: () => {
      toast.error("Job match failed");
    },
  });
}
