
"use client";
import { motion } from "framer-motion";
import { ExternalLink, AlertCircle } from "lucide-react";
import type { PolicyPosition } from "@/lib/api";

interface Props { positions: PolicyPosition[]; candidateName: string; }

const TOPIC_LABELS: Record<string, string> = {
  economy: "Economy",
  healthcare: "Healthcare",
  immigration: "Immigration",
  environment: "Environment",
  education: "Education",
  gun_policy: "Gun Policy",
  foreign_policy: "Foreign Policy",
  social_security: "Social Security",
  housing: "Housing",
  criminal_justice: "Criminal Justice",
};

export function PolicyGrid({ positions, candidateName }: Props) {
  const filled = positions.filter(p => p.positionSummary);
  const empty = positions.filter(p => !p.positionSummary);

  if (!positions.length) return (
    <div className="glass-card p-8 text-center">
      <AlertCircle size={32} className="text-muted mx-auto mb-3" />
      <p className="text-muted">No policy positions found for {candidateName}.</p>
      <p className="text-muted text-sm mt-1">We may not have been able to scrape their campaign website yet.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-muted text-sm flex items-center gap-1.5">
        <AlertCircle size={13} />
        AI-generated summaries based on official campaign websites. Always verify at the source.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filled.map((p, i) => (
          <motion.div key={p.topic} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-primary font-semibold text-sm">{TOPIC_LABELS[p.topic] || p.topic}</span>
              {p.sourceUrl && (
                <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-white transition-colors">
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
            <p className="text-sm text-white/80 leading-relaxed">{p.positionSummary}</p>
            {p.confidenceScore && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 bg-border rounded-full h-1">
                  <div className="bg-primary h-1 rounded-full" style={{ width: `${Number(p.confidenceScore) * 100}%` }} />
                </div>
                <span className="text-muted text-xs">{Math.round(Number(p.confidenceScore) * 100)}% confidence</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
