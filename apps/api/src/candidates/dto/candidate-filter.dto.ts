import { IsOptional, IsString, IsNumberString } from "class-validator";

export class CandidateFilterDto {
  @IsOptional() @IsString() office?: string;   // H, S, P
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() party?: string;
  @IsOptional() @IsNumberString() cycle?: string;
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsNumberString() page?: number;
  @IsOptional() @IsNumberString() limit?: number;
}