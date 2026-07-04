"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResumeDropzone } from "@/components/upload/dropzone";
import { useResumes } from "@/hooks/use-resumes";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatBytes } from "@/lib/utils";
import { FileText, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_ICON = {
  completed: CheckCircle2,
  processing: Loader2,
  pending: Clock,
  failed: XCircle,
} as const;

const STATUS_COLOR = {
  completed: "text-emerald-500",
  processing: "text-blue-500",
  pending: "text-amber-500",
  failed: "text-red-500",
} as const;

export default function UploadPage() {
  const { data: resumesData } = useResumes();
  const resumes = resumesData?.resumes ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Upload Resume</h1>
        <p className="text-sm text-muted-foreground">
          PDF or DOCX · Max 10MB · Evaluated by the interviewstreet hiring-agent engine
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ResumeDropzone />
        </CardContent>
      </Card>

      {resumes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Your Resumes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {resumes.map((resume) => {
              const Icon = STATUS_ICON[resume.status] ?? FileText;
              return (
                <div key={resume.id} className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-muted/50">
                  <Icon className={cn("h-4 w-4 shrink-0", STATUS_COLOR[resume.status], resume.status === "processing" && "animate-spin")} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{resume.original_filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(resume.file_size)} · {formatDate(resume.created_at)}
                    </p>
                  </div>
                  <Badge variant={resume.status === "completed" ? "success" : resume.status === "failed" ? "destructive" : "outline"} className="text-xs capitalize">
                    {resume.status}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
