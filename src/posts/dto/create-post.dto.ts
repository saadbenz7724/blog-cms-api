import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  IsNotEmpty,
  ArrayUnique,
} from 'class-validator';
import { PostStatus } from '../post.entity';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsNumber({}, { each: true })
  tagIds?: number[];
}