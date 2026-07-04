"use client";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle } from "lucide-react";
import type { Evaluation } from "@/types/api";

interface StrengthsWeaknessesProps {
  evaluation: Evaluation;
}

export function StrengthsWeaknesses({ evaluation }: StrengthsWeaknessesProps) {
  const strengths = evaluation.key_strengths ?? [];
  const weaknesses = evaluation.areas_for_improvement ?? [];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Strengths */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          Key Strengths
        </h3>
        <ul className="space-y-2">
          {strengths.length === 0 ? (
            <li className="text-sm text-muted-foreground">No strengths identified</li>
          ) : (
            strengths.map((s, i) => (
              <motion.li
                key={i}
                className="flex items-start gap-2 text-sm"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {s}
              </motion.li>
            ))
          )}
        </ul>
      </div>

      {/* Weaknesses */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-4 w-4" />
          Areas for Improvement
        </h3>
        <ul className="space-y-2">
          {weaknesses.length === 0 ? (
            <li className="text-sm text-muted-foreground">No areas identified</li>
          ) : (
            weaknesses.map((w, i) => (
              <motion.li
                key={i}
                className="flex items-start gap-2 text-sm"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {w}
              </motion.li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
