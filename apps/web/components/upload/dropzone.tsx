"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useUpload } from "@/hooks/use-upload";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
};

export function ResumeDropzone() {
  const { upload, isUploading, progress, reset } = useUpload();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejected: any[]) => {
      setError(null);
      if (rejected.length > 0) {
        const err = rejected[0].errors[0];
        if (err.code === "file-too-large") setError(`File too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB`);
        else if (err.code === "file-invalid-type") setError("Only PDF and DOCX files are accepted");
        else setError(err.message);
        return;
      }
      if (accepted.length > 0) {
        setSelectedFile(accepted[0]);
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: MAX_SIZE,
    multiple: false,
    disabled: isUploading,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    setError(null);
    try {
      await upload(selectedFile);
      setSelectedFile(null);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Upload failed");
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-all duration-200",
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-muted/30",
          isUploading && "pointer-events-none opacity-60"
        )}
      >
        <input {...getInputProps()} />
        <motion.div
          animate={{ y: isDragActive ? -4 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex flex-col items-center gap-3 text-center"
        >
          <div className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full transition-colors",
            isDragActive ? "bg-primary/20" : "bg-muted"
          )}>
            <Upload className={cn("h-6 w-6 transition-colors", isDragActive ? "text-primary" : "text-muted-foreground")} />
          </div>
          <div>
            <p className="text-sm font-medium">
              {isDragActive ? "Drop your resume here" : "Drag & drop your resume"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF or DOCX · Max {MAX_SIZE / 1024 / 1024}MB · <span className="text-primary">Browse files</span>
            </p>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedFile && !isUploading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-lg border bg-card p-3"
          >
            <FileText className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedFile(null); reset(); }}>
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {isUploading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2 rounded-lg border bg-card p-4"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Uploading & evaluating…</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground">
              The hiring-agent is analyzing your resume. This may take 30–90 seconds.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </motion.div>
      )}

      {selectedFile && !isUploading && (
        <Button onClick={handleUpload} className="w-full" size="lg">
          Analyze Resume
        </Button>
      )}
    </div>
  );
}
