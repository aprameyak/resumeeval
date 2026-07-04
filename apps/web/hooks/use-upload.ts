"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resumesApi } from "@/lib/api";
import { toast } from "sonner";

export function useUpload() {
  const [progress, setProgress] = useState(0);
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (file: File) =>
      resumesApi.upload(file, (pct) => setProgress(pct)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resumes"] });
      qc.invalidateQueries({ queryKey: ["evaluations"] });
      toast.success("Resume uploaded — evaluation started!");
      setProgress(0);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || "Upload failed";
      toast.error(msg);
      setProgress(0);
    },
  });

  return {
    upload: mutation.mutateAsync,
    isUploading: mutation.isPending,
    progress,
    reset: () => {
      mutation.reset();
      setProgress(0);
    },
  };
}
