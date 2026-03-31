import { IsOptional, IsEnum } from 'class-validator';
import { PostStatus } from '../../posts/post.entity';

export class AdminQueryPostsDto {
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;
}