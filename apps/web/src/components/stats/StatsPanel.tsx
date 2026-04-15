
"use client";
import type { MemberStat } from "@/lib/api";

interface Props { stats: MemberStat; }

function GaugeStat({ label, value, color }: { label: string; value?: number; color: string }) {
  const pct = value ?? 0;
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted">{label}</span>
        <span className="font-bold text-lg">{pct.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-border rounded-full h-2">
        <div className={`h-2 rounded-full transition-all duration-1000 ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

export function StatsPanel({ stats }: Props) {
  return (
    <div>
      <h3 className="font-semibold mb-4 text-sm text-muted uppercase tracking-wider">Legislative Performance — {stats.congressNumber}th Congress</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <GaugeStat label="Party Loyalty" value={Number(stats.partyLoyaltyPct)} color="bg-primary" />
        <GaugeStat label="Bipartisan Votes" value={Number(stats.bipartisanPct)} color="bg-independent" />
        <GaugeStat label="Votes Missed" value={Number(stats.missedVotesPct)} color="bg-republican" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 text-center">
          <div className="text-3xl font-bold text-accent">{stats.billsSponsored ?? 0}</div>
          <div className="text-muted text-sm mt-1">Bills Sponsored</div>
        </div>
        <div className="glass-card p-5 text-center">
          <div className="text-3xl font-bold text-democrat">{stats.billsCosponsored ?? 0}</div>
          <div className="text-muted text-sm mt-1">Bills Co-sponsored</div>
        </div>
      </div>
    </div>
  );
}
