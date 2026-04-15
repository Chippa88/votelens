import { Controller, Get, Query } from "@nestjs/common";
import { SearchService } from "./search.service";

@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@Query("q") q: string, @Query("limit") limit = "10") {
    return this.searchService.search(q, +limit);
  }

  @Get("reindex")
  reindex() {
    return this.searchService.reindexAll();
  }
}