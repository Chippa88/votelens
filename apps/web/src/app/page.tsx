"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, TrendingUp, DollarSign, Vote, ArrowRight, Zap } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";
import { StatCounter } from "@/components/ui/StatCounter";
import { CandidateCard } from "@/components/candidate/CandidateCard";
import { getCandidates } from "@/lib/api";
import type { Candidate } from "@/lib/api";

export default function HomePage() {
  const [featured, setFeatured] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCandidates({ limit: 6, office: "S", page: 1 })
      .then((res) => setFeatured(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass-card border-0 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Vote size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">VoteLens</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-muted">
          <a href="/elections" className="hover:text-white transition-colors">Elections</a>
          <a href="/compare" className="hover:text-white transition-colors">Compare</a>
          <a href="#about" className="hover:text-white transition-colors">About</a>
        </div>
        <a href="/elections" className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Browse Candidates <ArrowRight size={14} />
        </a>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 overflow-hidden">
        {/* Background gradient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-democrat/8 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-4xl relative z-10"
        >
          <div className="inline-flex items-center gap-2 bg-surface border border-border text-muted text-sm px-4 py-2 rounded-full mb-8">
            <Zap size={14} className="text-accent" />
            <span>Updated nightly from FEC + Congress.gov</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Know Your Candidates.{" "}
            <span className="gradient-text">For Real.</span>
          </h1>

          <p className="text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Campaign finance, voting records, and policy positions for every federal candidate —
            pulled directly from the FEC and Congress. No spin. Just data.
          </p>

          <SearchBar className="max-w-2xl mx-auto mb-6" />

          <p className="text-sm text-muted">
            Try: &quot;Bernie Sanders&quot;, &quot;Texas Senate&quot;, &quot;Republican House Florida&quot;
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid grid-cols-3 gap-8 mt-20 max-w-2xl relative z-10"
        >
          <StatCounter label="Federal Candidates" value={1247} suffix="+" />
          <StatCounter label="Votes Tracked" value={42800} suffix="+" />
          <StatCounter label="In Campaign Finance" value={2.1} prefix="$" suffix="B+" />
        </motion.div>
      </section>

      {/* FEATURED CANDIDATES */}
      <section className="px-6 py-24 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold">Senate Races to Watch</h2>
            <p className="text-muted mt-1">Key battleground seats in the 2026 cycle</p>
          </div>
          <a href="/elections?office=S" className="flex items-center gap-1.5 text-primary hover:text-primary/80 text-sm font-medium transition-colors">
            View all Senate races <ArrowRight size={14} />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
            : featured.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <CandidateCard candidate={c} />
                </motion.div>
              ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-24 bg-surface/30">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Three Sources. One Clean View.</h2>
          <p className="text-muted mb-16 max-w-xl mx-auto">VoteLens connects government data sources you should not have to navigate yourself.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: DollarSign, color: "text-accent", title: "FEC Campaign Finance", desc: "Every dollar raised and spent. Top donors, PAC support, and industry breakdown — pulled live from the Federal Election Commission." },
              { icon: Vote, color: "text-primary", title: "Congress.gov Voting Records", desc: "Complete voting history on every bill. Party loyalty scores, bipartisan index, and missed vote percentage from the Library of Congress." },
              { icon: TrendingUp, color: "text-democrat", title: "AI Policy Summaries", desc: "Policy positions extracted from official campaign websites and summarized by GPT-4o into neutral, readable 2-sentence briefs." },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="glass-card p-6 text-left">
                <div className={`w-10 h-10 rounded-lg bg-surface flex items-center justify-center mb-4 ${color}`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-muted text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 py-12 border-t border-border text-center text-muted text-sm">
        <p className="mb-2">VoteLens is a nonpartisan project. All data sourced from FEC, Congress.gov, and official campaign websites.</p>
        <p>Built for voters, not for parties. · <a href="/legal" className="hover:text-white transition-colors">Legal & Attribution</a></p>
      </footer>
    </main>
  );
}

function CardSkeleton() {
  return <div className="glass-card p-6 h-48 skeleton" />;
}