import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { QueryCommentDto } from './dto/query-comment.dto';
import { PostsService } from '../posts/posts.service';
import { UserRole } from '../users/user.entity';
import { PostStatus } from '../posts/post.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    private postsService: PostsService,
  ) {}

  async create(userId: number, dto: CreateCommentDto): Promise<Comment> {
    const post = await this.postsService.findOneById(dto.postId);

    if (post.status !== PostStatus.PUBLISHED) {
      throw new BadRequestException(
        'You can only comment on published posts',
      );
    }

    const comment = this.commentRepository.create({
      content: dto.content,
      userId,
      postId: dto.postId,
    });

    const saved = await this.commentRepository.save(comment);

    await this.postsService.incrementCommentCount(dto.postId);

    return saved;
  }

  async findByPost(postId: number, query: QueryCommentDto) {
    const { page = 1, limit = 10 } = query;

    const qb = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.post_id = :postId', { postId })
      .andWhere('comment.is_deleted = false')
      .select([
        'comment.id',
        'comment.content',
        'comment.likeCount',
        'comment.createdAt',
        'comment.updatedAt',
        'user.id',
        'user.fullName',
        'user.avatar',
      ])
      .orderBy('comment.created_at', 'DESC');

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async findOne(id: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['user', 'post'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment #${id} not found`);
    }

    return comment;
  }

  async update(
    id: number,
    userId: number,
    dto: UpdateCommentDto,
  ): Promise<Comment> {
    const comment = await this.findOne(id);

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    comment.content = dto.content;
    return this.commentRepository.save(comment);
  }

  async remove(
    id: number,
    userId: number,
    userRole: string,
  ): Promise<{ message: string }> {
    const comment = await this.findOne(id);

    if (comment.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    comment.isDeleted = true;
    await this.commentRepository.save(comment);

    await this.postsService.decrementCommentCount(comment.postId);

    return { message: 'Comment deleted successfully' };
  }

  async likeComment(id: number): Promise<{ likeCount: number }> {
    const comment = await this.findOne(id);

    await this.commentRepository.increment(
      { id: comment.id },
      'likeCount',
      1,
    );

    return { likeCount: comment.likeCount + 1 };
  }

  async findAll(query: QueryCommentDto) {
    const { page = 1, limit = 10 } = query;

    const qb = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.post', 'post')
      .where('comment.is_deleted = false')
      .select([
        'comment.id',
        'comment.content',
        'comment.likeCount',
        'comment.createdAt',
        'user.id',
        'user.fullName',
        'user.email',
        'post.id',
        'post.title',
        'post.slug',
      ])
      .orderBy('comment.created_at', 'DESC');

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }
}