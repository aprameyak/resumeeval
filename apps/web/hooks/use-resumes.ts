"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resumesApi } from "@/lib/api";
import { toast } from "sonner";

export function useResumes() {
  return useQuery({
    queryKey: ["resumes"],
    queryFn: () => resumesApi.list(),
  });
}

export function useResume(id: string) {
  return useQuery({
    queryKey: ["resumes", id],
    queryFn: () => resumesApi.get(id),
    enabled: !!id,
  });
}

export function useResumeEvaluations(resumeId: string) {
  return useQuery({
    queryKey: ["resumes", resumeId, "evaluations"],
    queryFn: () => resumesApi.getEvaluations(resumeId),
    enabled: !!resumeId,
  });
}

export function useDeleteResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resumesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resumes"] });
      toast.success("Resume deleted");
    },
    onError: () => {
      toast.error("Failed to delete resume");
    },
  });
}
