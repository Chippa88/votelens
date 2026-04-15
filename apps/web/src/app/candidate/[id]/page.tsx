"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Globe, DollarSign, Vote, FileText, BarChart2, ArrowLeft } from "lucide-react";
import { getCandidate, getCandidateFinance, getCandidateVotes, getCandidatePolicy, getCandidateStats } from "@/lib/api";
import type { Candidate, FinanceTotal, Donation, Vote as VoteType, PolicyPosition, MemberStat } from "@/lib/api";
import { PartyBadge } from "@/components/ui/PartyBadge";
import { FinanceChart } from "@/components/finance/FinanceChart";
import { VoteHistory } from "@/components/voting/VoteHistory";
import { PolicyGrid } from "@/components/policy/PolicyGrid";
import { StatsPanel } from "@/components/stats/StatsPanel";
import Link from "next/link";
import { clsx } from "clsx";

type Tab = "overview" | "finances" | "votes" | "policy";

function fmt(n: number): string {
  if (!n) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function CandidatePage() {
  const { id } = useParams<{ id: string }>();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [finance, setFinance] = useState<{ totals: FinanceTotal; topDonors: Donation[] } | null>(null);
  const [votes, setVotes] = useState<{ votes: VoteType[]; total: number } | null>(null);
  const [policy, setPolicy] = useState<PolicyPosition[]>([]);
  const [stats, setStats] = useState<MemberStat | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getCandidate(id).then(setCandidate),
      getCandidateFinance(id).then(setFinance),
      getCandidateVotes(id).then(setVotes),
      getCandidatePolicy(id).then(setPolicy),
      getCandidateStats(id).then(setStats),
    ]).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen px-6 pt-16"><div className="max-w-5xl mx-auto"><div className="glass-card p-8 skeleton h-48 mb-4" /><div className="glass-card p-6 skeleton h-96" /></div></div>;
  if (!candidate) return <div className="min-h-screen flex items-center justify-center text-muted">Candidate not found.</div>;

  const officeLabel = candidate.office === "H" ? "U.S. House" : candidate.office === "S" ? "U.S. Senate" : "President";
  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: BarChart2 },
    { key: "finances", label: "Finances", icon: DollarSign },
    { key: "votes", label: "Votes", icon: Vote },
    { key: "policy", label: "Policy", icon: FileText },
  ];

  return (
    <main className="min-h-screen pb-20">
      <div className="px-6 pt-6 max-w-5xl mx-auto">
        <Link href="/elections" className="inline-flex items-center gap-1.5 text-muted hover:text-white text-sm transition-colors">
          <ArrowLeft size={14} /> Back to elections
        </Link>
      </div>

      <section className="px-6 pt-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 rounded-b-none border-b-0">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center text-3xl font-bold flex-shrink-0">
              {candidate.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-3xl font-bold">{candidate.fullName}</h1>
                <PartyBadge party={candidate.party} />
                {candidate.incumbent && <span className="bg-accent/20 text-accent text-xs px-2 py-1 rounded-md font-medium">Incumbent</span>}
              </div>
              <div className="flex items-center gap-4 text-muted text-sm flex-wrap">
                <span className="flex items-center gap-1.5"><MapPin size={13} /> {candidate.state} {officeLabel}</span>
                {candidate.campaignWebsite && (
                  <a href={candidate.campaignWebsite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors">
                    <Globe size={13} /> Official Website
                  </a>
                )}
              </div>
              {finance?.totals && (
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {[["Raised", fmt(Number(finance.totals.totalReceipts))], ["Spent", fmt(Number(finance.totals.totalDisbursements))], ["Cash on Hand", fmt(Number(finance.totals.cashOnHand))]].map(([label, value]) => (
                    <div key={label}><div className="text-xl font-bold text-accent">{value}</div><div className="text-xs text-muted">{label}</div></div>
                  ))}
                </div>
              )}
            </div>
            <Link href={`/compare?a=${id}`} className="flex-shrink-0 bg-surface border border-border hover:border-primary text-sm px-4 py-2 rounded-lg transition-colors">Compare</Link>
          </div>
        </motion.div>

        <div className="flex border-x border-b border-border bg-surface/50 rounded-b-xl overflow-hidden mb-8">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={clsx("flex items-center gap-1.5 px-6 py-3.5 text-sm font-medium transition-colors flex-1 justify-center",
                tab === key ? "text-white border-b-2 border-primary" : "text-muted hover:text-white")}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {tab === "overview" && <div className="space-y-6">{stats && <StatsPanel stats={stats} />}</div>}
          {tab === "finances" && <FinanceChart finance={finance} />}
          {tab === "votes" && <VoteHistory votes={votes?.votes || []} total={votes?.total || 0} />}
          {tab === "policy" && <PolicyGrid positions={policy} candidateName={candidate.fullName} />}
        </motion.div>
      </section>
    </main>
  );
}
