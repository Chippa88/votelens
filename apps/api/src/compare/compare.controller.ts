import { Controller, Get, Query } from "@nestjs/common";
import { CompareService } from "./compare.service";

@Controller("compare")
export class CompareController {
  constructor(private readonly compareService: CompareService) {}

  @Get()
  compare(@Query("ids") ids: string) {
    const idList = ids.split(",").slice(0, 2);
    return this.compareService.compare(idList);
  }
}