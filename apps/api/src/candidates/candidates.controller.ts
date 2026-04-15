import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import { CandidatesService } from "./candidates.service";
import { CandidateFilterDto } from "./dto/candidate-filter.dto";

@Controller("candidates")
@UseGuards(ThrottlerGuard)
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get()
  findAll(@Query() filters: CandidateFilterDto) {
    return this.candidatesService.findAll(filters);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.candidatesService.findOne(id);
  }

  @Get(":id/finance")
  getFinance(@Param("id") id: string) {
    return this.candidatesService.getFinance(id);
  }

  @Get(":id/votes")
  getVotes(@Param("id") id: string, @Query("page") page = 1) {
    return this.candidatesService.getVotes(id, +page);
  }

  @Get(":id/policy")
  getPolicy(@Param("id") id: string) {
    return this.candidatesService.getPolicy(id);
  }

  @Get(":id/stats")
  getStats(@Param("id") id: string) {
    return this.candidatesService.getStats(id);
  }
}