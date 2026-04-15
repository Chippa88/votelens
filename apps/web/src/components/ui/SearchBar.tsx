"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, X } from "lucide-react";
import { searchCandidates } from "@/lib/api";
import type { Candidate } from "@/lib/api";
import { PartyBadge } from "./PartyBadge";
import { clsx } from "clsx";

interface Props { className?: string; }

export function SearchBar({ className }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchCandidates(query);
        setResults(data.hits || []);
        setOpen(true);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
  }, [query]);

  return (
    <div ref={ref} className={clsx("relative w-full", className)}>
      <div className="flex items-center gap-3 bg-surface border border-border hover:border-primary/50 focus-within:border-primary rounded-xl px-4 py-3.5 transition-colors">
        {loading ? <Loader2 size={18} className="text-muted animate-spin flex-shrink-0" /> : <Search size={18} className="text-muted flex-shrink-0" />}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search candidates by name, state, or office..."
          className="flex-1 bg-transparent text-white placeholder-muted outline-none text-base"
          onKeyDown={(e) => {
            if (e.key === "Enter" && query) router.push(`/elections?q=${encodeURIComponent(query)}`);
          }}
        />
        {query && <button onClick={() => { setQuery(""); setResults([]); setOpen(false); }}><X size={16} className="text-muted hover:text-white transition-colors" /></button>}
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-full left-0 right-0 mt-2 glass-card py-2 z-50 max-h-80 overflow-y-auto"
          >
            {results.map((c) => (
              <button
                key={c.id}
                onClick={() => { router.push(`/candidate/${c.id}`); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-border flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {c.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{c.fullName}</div>
                  <div className="text-muted text-xs">{c.state} · {c.office === "H" ? "House" : c.office === "S" ? "Senate" : "President"}</div>
                </div>
                <PartyBadge party={c.party} size="sm" />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}