import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CandidateFilterDto } from "./dto/candidate-filter.dto";

@Injectable()
export class CandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: CandidateFilterDto) {
    const { office, state, party, cycle, q, page = 1, limit = 24 } = filters;
    const skip = (+page - 1) * +limit;

    const where: any = {};
    if (office) where.office = office;
    if (state) where.state = state;
    if (party) where.party = { contains: party, mode: "insensitive" };
    if (cycle) where.electionCycle = +cycle;
    if (q) {
      where.fullName = { contains: q, mode: "insensitive" };
    }

    const [data, total] = await Promise.all([
      this.prisma.candidate.findMany({
        where,
        skip,
        take: +limit,
        orderBy: { fullName: "asc" },
        include: {
          financeTotals: {
            orderBy: { cycle: "desc" },
            take: 1,
          },
        },
      }),
      this.prisma.candidate.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: +page,
        limit: +limit,
        totalPages: Math.ceil(total / +limit),
      },
    };
  }

  async findOne(id: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: {
        financeTotals: { orderBy: { cycle: "desc" }, take: 1 },
        memberStats: { orderBy: { congressNumber: "desc" }, take: 1 },
        policyPositions: true,
      },
    });
    if (!candidate) throw new NotFoundException(`Candidate ${id} not found`);
    return candidate;
  }

  async getFinance(id: string) {
    const [totals, topDonors] = await Promise.all([
      this.prisma.financeTotal.findFirst({
        where: { candidateId: id },
        orderBy: { cycle: "desc" },
      }),
      this.prisma.donation.findMany({
        where: { candidateId: id },
        orderBy: { amount: "desc" },
        take: 20,
      }),
    ]);
    return { totals, topDonors };
  }

  async getVotes(id: string, page: number) {
    const limit = 20;
    const skip = (page - 1) * limit;
    const [votes, total] = await Promise.all([
      this.prisma.vote.findMany({
        where: { candidateId: id },
        orderBy: { voteDate: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.vote.count({ where: { candidateId: id } }),
    ]);
    return { votes, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getPolicy(id: string) {
    return this.prisma.policyPosition.findMany({
      where: { candidateId: id },
      orderBy: { topic: "asc" },
    });
  }

  async getStats(id: string) {
    return this.prisma.memberStat.findFirst({
      where: { candidateId: id },
      orderBy: { congressNumber: "desc" },
    });
  }
}