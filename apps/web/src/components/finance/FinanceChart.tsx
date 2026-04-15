
"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import type { FinanceTotal, Donation } from "@/lib/api";

interface Props {
  finance: { totals: FinanceTotal; topDonors: Donation[] } | null;
}

const COLORS = ["#6366F1", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

function fmt(n: number): string {
  if (!n || isNaN(n)) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export function FinanceChart({ finance }: Props) {
  if (!finance?.totals) return <div className="text-muted text-center py-12">No finance data available.</div>;
  const t = finance.totals;

  const breakdown = [
    { name: "Small Donors", value: Number(t.individualUnitemized) || 0 },
    { name: "Large Donors", value: Number(t.individualItemized) || 0 },
    { name: "PAC Money", value: Number(t.pacContributions) || 0 },
    { name: "Self-Funded", value: Number(t.candidateContributions) || 0 },
  ].filter(d => d.value > 0);

  const donorData = finance.topDonors.slice(0, 10).map(d => ({
    name: d.contributorName?.split(",")[0] || "Unknown",
    amount: Number(d.amount) || 0,
  }));

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Raised", value: fmt(Number(t.totalReceipts)), color: "text-accent" },
          { label: "Total Spent", value: fmt(Number(t.totalDisbursements)), color: "text-republican" },
          { label: "Cash on Hand", value: fmt(Number(t.cashOnHand)), color: "text-independent" },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card p-5">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-muted text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Funding breakdown pie */}
        {breakdown.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Funding Sources</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={breakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 8, color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2">
              {breakdown.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i] }} />
                  {d.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top donors bar chart */}
        {donorData.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Top Donors</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={donorData} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis type="number" tickFormatter={fmt} tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} width={90} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 8, color: "#fff" }} />
                <Bar dataKey="amount" fill="#6366F1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Full donor table */}
      {finance.topDonors.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border"><h3 className="font-semibold">Individual Donors</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-muted text-xs">{["Donor", "Employer", "Occupation", "Amount", "Date"].map(h => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {finance.topDonors.map((d, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{d.contributorName || "—"}</td>
                    <td className="px-4 py-3 text-muted">{d.contributorEmployer || "—"}</td>
                    <td className="px-4 py-3 text-muted">{d.contributorOccupation || "—"}</td>
                    <td className="px-4 py-3 text-accent font-semibold">{fmt(Number(d.amount))}</td>
                    <td className="px-4 py-3 text-muted">{d.contributionDate ? new Date(d.contributionDate).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
