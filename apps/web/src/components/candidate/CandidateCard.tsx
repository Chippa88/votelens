"use client";
import { motion } from "framer-motion";
import { DollarSign, MapPin, ExternalLink } from "lucide-react";
import { PartyBadge } from "@/components/ui/PartyBadge";
import type { Candidate } from "@/lib/api";
import Link from "next/link";

interface Props { candidate: Candidate; }

function formatMoney(n?: number): string {
  if (!n) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function CandidateCard({ candidate: c }: Props) {
  const finance = c.financeTotals?.[0];
  const officeLabel = c.office === "H" ? "House" : c.office === "S" ? "Senate" : "President";

  return (
    <Link href={`/candidate/${c.id}`}>
      <motion.div
        whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(99,102,241,0.1)" }}
        transition={{ duration: 0.2 }}
        className="glass-card p-6 cursor-pointer h-full flex flex-col gap-4 group"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-lg font-bold flex-shrink-0">
              {c.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">
                {c.fullName}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-muted text-xs">
                <MapPin size={10} />
                <span>{c.state} · {officeLabel}</span>
                {c.incumbent && (
                  <span className="bg-accent/20 text-accent text-xs px-1.5 py-0.5 rounded-sm font-medium">Incumbent</span>
                )}
              </div>
            </div>
          </div>
          <PartyBadge party={c.party} size="sm" />
        </div>

        {/* Finance */}
        {finance && (
          <div className="flex items-center gap-1.5 text-sm">
            <DollarSign size={14} className="text-accent" />
            <span className="font-semibold text-accent">{formatMoney(Number(finance.totalReceipts))}</span>
            <span className="text-muted text-xs">raised</span>
          </div>
        )}

        {/* Campaign link */}
        {c.campaignWebsite && (
          <div className="mt-auto pt-2 border-t border-border flex items-center gap-1.5 text-xs text-muted">
            <ExternalLink size={11} />
            <span className="truncate">{c.campaignWebsite.replace(/^https?:\/\//, "")}</span>
          </div>
        )}
      </motion.div>
    </Link>
  );
}