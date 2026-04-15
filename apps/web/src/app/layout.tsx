import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.scss";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "VoteLens — Know Your Candidates. For Real.", template: "%s | VoteLens" },
  description: "Federal election political intelligence. Campaign finance, voting records, and policy positions — all in one place.",
  keywords: ["federal elections", "campaign finance", "voting records", "political transparency", "FEC data"],
  openGraph: {
    type: "website",
    siteName: "VoteLens",
    title: "VoteLens — Know Your Candidates. For Real.",
    description: "Federal election political intelligence. Campaign finance, voting records, and policy positions.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-bg text-white">
        {children}
      </body>
    </html>
  );
}