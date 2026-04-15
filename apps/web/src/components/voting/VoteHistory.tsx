
"use client";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, MinusCircle } from "lucide-react";
import type { Vote } from "@/lib/api";
import { clsx } from "clsx";

interface Props { votes: Vote[]; total: number; }

function VoteIcon({ position }: { position?: string }) {
  const p = position?.toLowerCase() || "";
  if (p === "yes" || p === "yea" || p === "sponsored") return <CheckCircle size={16} className="text-independent flex-shrink-0" />;
  if (p === "no" || p === "nay") return <XCircle size={16} className="text-republican flex-shrink-0" />;
  return <MinusCircle size={16} className="text-muted flex-shrink-0" />;
}

export function VoteHistory({ votes, total }: Props) {
  if (!votes.length) return <div className="text-muted text-center py-12 glass-card">No voting record available.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Voting Record</h3>
        <span className="text-muted text-sm">{total} total votes</span>
      </div>
      <div className="space-y-2">
        {votes.map((vote, i) => (
          <motion.div key={vote.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
            className="glass-card p-4 flex items-center gap-4">
            <VoteIcon position={vote.votePosition} />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{vote.billTitle || vote.billId || "Unknown Bill"}</div>
              {vote.billSummary && <div className="text-muted text-xs mt-0.5 line-clamp-1">{vote.billSummary}</div>}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={clsx("text-xs font-semibold px-2 py-1 rounded-md",
                vote.votePosition?.toLowerCase() === "yes" || vote.votePosition?.toLowerCase() === "yea" ? "bg-independent/20 text-independent" :
                vote.votePosition?.toLowerCase() === "no" || vote.votePosition?.toLowerCase() === "nay" ? "bg-republican/20 text-republican" :
                "bg-surface text-muted"
              )}>
                {vote.votePosition || "—"}
              </span>
              {vote.voteDate && <span className="text-muted text-xs">{new Date(vote.voteDate).toLocaleDateString()}</span>}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
