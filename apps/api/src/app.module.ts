import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { CandidatesModule } from "./candidates/candidates.module";
import { FinanceModule } from "./finance/finance.module";
import { VotingModule } from "./voting/voting.module";
import { PolicyModule } from "./policy/policy.module";
import { SearchModule } from "./search/search.module";
import { CompareModule } from "./compare/compare.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    CandidatesModule,
    FinanceModule,
    VotingModule,
    PolicyModule,
    SearchModule,
    CompareModule,
  ],
})
export class AppModule {}