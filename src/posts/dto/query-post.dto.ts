import { IsOptional, IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PostStatus } from '../post.entity';

export class QueryPostDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tagId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  authorId?: number;

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}