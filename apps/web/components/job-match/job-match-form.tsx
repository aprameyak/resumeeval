"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useJobMatch } from "@/hooks/use-evaluations";
import { useResumes } from "@/hooks/use-resumes";
import type { JobMatch } from "@/types/api";
import { Loader2 } from "lucide-react";

const schema = z.object({
  resume_id: z.string().min(1, "Select a resume"),
  job_description: z.string().min(50, "Please provide a more detailed job description (min 50 chars)"),
  job_title: z.string().optional(),
  company: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface JobMatchFormProps {
  onResult: (result: JobMatch) => void;
}

export function JobMatchForm({ onResult }: JobMatchFormProps) {
  const { data: resumesData } = useResumes();
  const jobMatchMutation = useJobMatch();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    const result = await jobMatchMutation.mutateAsync(values);
    onResult(result);
  };

  const resumes = resumesData?.resumes?.filter((r) => r.status === "completed") ?? [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Resume</Label>
        <select
          {...register("resume_id")}
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Select a resume...</option>
          {resumes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.original_filename}
            </option>
          ))}
        </select>
        {errors.resume_id && <p className="text-xs text-destructive">{errors.resume_id.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Job Title (optional)</Label>
          <Input {...register("job_title")} placeholder="e.g. Senior Software Engineer" />
        </div>
        <div className="space-y-1.5">
          <Label>Company (optional)</Label>
          <Input {...register("company")} placeholder="e.g. Google" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Job Description</Label>
        <Textarea
          {...register("job_description")}
          placeholder="Paste the full job description here..."
          rows={10}
          className="resize-none"
        />
        {errors.job_description && <p className="text-xs text-destructive">{errors.job_description.message}</p>}
      </div>

      <Button type="submit" disabled={jobMatchMutation.isPending} className="w-full">
        {jobMatchMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing match…
          </>
        ) : (
          "Analyze Job Match"
        )}
      </Button>
    </form>
  );
}
