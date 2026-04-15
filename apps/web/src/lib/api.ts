const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `API error ${res.status}`);
  }
  return res.json();
}

export interface Candidate {
  id: string;
  fecCandidateId?: string;
  bioguideId?: string;
  fullName: string;
  party?: string;
  office?: string;
  state?: string;
  district?: string;
  incumbent: boolean;
  campaignWebsite?: string;
  photoUrl?: string;
  electionCycle?: number;
  financeTotals?: FinanceTotal[];
  memberStats?: MemberStat[];
  policyPositions?: PolicyPosition[];
}

export interface FinanceTotal {
  cycle: number;
  totalReceipts?: number;
  totalDisbursements?: number;
  cashOnHand?: number;
  individualItemized?: number;
  individualUnitemized?: number;
  pacContributions?: number;
  candidateContributions?: number;
}

export interface Donation {
  id: string;
  contributorName?: string;
  contributorEmployer?: string;
  contributorOccupation?: string;
  amount?: number;
  contributionDate?: string;
}

export interface Vote {
  id: string;
  billId?: string;
  billTitle?: string;
  billSummary?: string;
  votePosition?: string;
  voteDate?: string;
  chamber?: string;
}

export interface PolicyPosition {
  topic: string;
  positionSummary?: string;
  sourceUrl?: string;
  confidenceScore?: number;
}

export interface MemberStat {
  congressNumber: number;
  partyLoyaltyPct?: number;
  bipartisanPct?: number;
  missedVotesPct?: number;
  billsSponsored?: number;
  billsCosponsored?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// Candidates
export const getCandidates = (params: Record<string, string | number>) =>
  fetchAPI<PaginatedResponse<Candidate>>(`/candidates?${new URLSearchParams(params as any)}`);

export const getCandidate = (id: string) =>
  fetchAPI<Candidate>(`/candidates/${id}`);

export const getCandidateFinance = (id: string) =>
  fetchAPI<{ totals: FinanceTotal; topDonors: Donation[] }>(`/candidates/${id}/finance`);

export const getCandidateVotes = (id: string, page = 1) =>
  fetchAPI<{ votes: Vote[]; total: number; totalPages: number }>(`/candidates/${id}/votes?page=${page}`);

export const getCandidatePolicy = (id: string) =>
  fetchAPI<PolicyPosition[]>(`/candidates/${id}/policy`);

export const getCandidateStats = (id: string) =>
  fetchAPI<MemberStat>(`/candidates/${id}/stats`);

// Compare
export const compareCandidates = (ids: string[]) =>
  fetchAPI<{ candidates: Candidate[]; sharedVotes: any[] }>(`/compare?ids=${ids.join(",")}`);

// Search
export const searchCandidates = (q: string) =>
  fetchAPI<{ hits: Candidate[] }>(`/search?q=${encodeURIComponent(q)}`);