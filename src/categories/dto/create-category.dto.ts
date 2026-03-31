import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Web Development' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Posts about web technologies' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'web-development' })
  @IsOptional()
  @IsString()
  slug?: string;
}