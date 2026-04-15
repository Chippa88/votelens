import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import MeiliSearch from "meilisearch";

@Injectable()
export class SearchService implements OnModuleInit {
  private client: MeiliSearch;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService
  ) {
    this.client = new MeiliSearch({
      host: this.config.get("MEILISEARCH_URL", "http://localhost:7700"),
      apiKey: this.config.get("MEILISEARCH_MASTER_KEY", ""),
    });
  }

  async onModuleInit() {
    const index = this.client.index("candidates");
    await index.updateSettings({
      searchableAttributes: ["fullName", "state", "party", "office"],
      filterableAttributes: ["party", "state", "office", "electionCycle"],
      sortableAttributes: ["fullName"],
    });
  }

  async search(q: string, limit = 10) {
    if (!q || q.trim().length === 0) return { hits: [] };
    const index = this.client.index("candidates");
    const results = await index.search(q, { limit, attributesToHighlight: ["fullName"] });
    return results;
  }

  async reindexAll() {
    const candidates = await this.prisma.candidate.findMany({
      include: { financeTotals: { take: 1, orderBy: { cycle: "desc" } } },
    });
    const index = this.client.index("candidates");
    await index.addDocuments(
      candidates.map((c) => ({
        id: c.id,
        fullName: c.fullName,
        party: c.party,
        state: c.state,
        office: c.office,
        electionCycle: c.electionCycle,
        photoUrl: c.photoUrl,
        totalRaised: c.financeTotals[0]?.totalReceipts?.toString() || "0",
      }))
    );
    return { indexed: candidates.length };
  }
}