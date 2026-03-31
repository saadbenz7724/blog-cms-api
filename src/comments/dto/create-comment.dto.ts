import { IsString, IsNumber, IsNotEmpty, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  content!: string;

  @IsNumber()
  postId!: number;
}