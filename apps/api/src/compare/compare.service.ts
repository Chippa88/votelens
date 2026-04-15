import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CompareService {
  constructor(private readonly prisma: PrismaService) {}

  async compare(ids: string[]) {
    if (ids.length < 2) throw new BadRequestException("Provide exactly 2 candidate IDs");

    const candidates = await Promise.all(
      ids.map((id) =>
        this.prisma.candidate.findUnique({
          where: { id },
          include: {
            financeTotals: { orderBy: { cycle: "desc" }, take: 1 },
            memberStats: { orderBy: { congressNumber: "desc" }, take: 1 },
            policyPositions: true,
            votes: { orderBy: { voteDate: "desc" }, take: 50 },
          },
        })
      )
    );

    // Find bills both candidates voted on
    const [a, b] = candidates;
    const aBillIds = new Set(a?.votes.map((v) => v.billId).filter(Boolean));
    const sharedVotes = b?.votes
      .filter((v) => v.billId && aBillIds.has(v.billId))
      .map((bVote) => {
        const aVote = a?.votes.find((v) => v.billId === bVote.billId);
        return {
          billId: bVote.billId,
          billTitle: bVote.billTitle,
          voteDate: bVote.voteDate,
          candidateA: aVote?.votePosition || "Unknown",
          candidateB: bVote.votePosition,
          agreed: aVote?.votePosition === bVote.votePosition,
        };
      });

    return { candidates, sharedVotes: sharedVotes || [] };
  }
}