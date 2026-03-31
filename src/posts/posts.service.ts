import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostStatus } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { TagsService } from '../tags/tags.service';
import { CategoriesService } from '../categories/categories.service';
import { UserRole } from '../users/user.entity';
import { Tag } from '../tags/tag.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    private tagsService: TagsService,
    private categoriesService: CategoriesService,
    private redisService: RedisService,
  ) {}

  private async clearPostsCache(): Promise<void> {
    await this.redisService.delByPattern('posts:feed:*');
    console.log('Posts feed cache cleared');
  }
  private generateSlug(title: string): string {
    return (
      title
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '') +
      '-' +
      Date.now()
    );
  }

  async create(authorId: number, dto: CreatePostDto): Promise<Post> {
    if (dto.categoryId) {
      await this.categoriesService.findOne(dto.categoryId);
    }

    let tags: Tag[] = [];
    if (dto.tagIds && dto.tagIds.length > 0) {
      tags = await this.tagsService.findByIds(dto.tagIds);
      if (tags.length !== dto.tagIds.length) {
        throw new BadRequestException('One or more tag IDs are invalid');
      }
    }

    const slug = dto.slug || this.generateSlug(dto.title);

    const existing = await this.postRepository.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException('A post with this slug already exists');
    }

    const postData: any = {
      ...dto,
      authorId,
      slug,
      tags,
    };

    if (dto.status === PostStatus.PUBLISHED) {
      postData.publishedAt = new Date();
    }

    const post = this.postRepository.create(postData);

    const saved = await this.postRepository.save(post);

    if (tags.length > 0) {
      await Promise.all(
        tags.map((tag) => this.tagsService.incrementPostCount(tag.id)),
      );
    }

    if (dto.status === PostStatus.PUBLISHED) {
      await this.clearPostsCache();
    }

    return saved[0];
  }

  async findAll(query: QueryPostDto) {
    const {
      search,
      categoryId,
      tagId,
      authorId,
      page = 1,
      limit = 10,
    } = query;

    const cacheKey = `posts:feed:${JSON.stringify({
      search,
      categoryId,
      tagId,
      authorId,
      page,
      limit,
    })}`;

    const CACHE_TTL = 300;

    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      console.log(`Cache HIT — ${cacheKey}`);
      return { ...(cached as object), fromCache: true };
    }

    console.log(`Cache MISS — querying database`);

    const qb = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.tags', 'tags')
      .where('post.is_deleted = false')
      .andWhere('post.status = :status', { status: PostStatus.PUBLISHED })
      .select([
        'post.id',
        'post.title',
        'post.slug',
        'post.excerpt',
        'post.thumbnail',
        'post.status',
        'post.likeCount',
        'post.viewCount',
        'post.commentCount',
        'post.publishedAt',
        'post.createdAt',
        'author.id',
        'author.fullName',
        'author.avatar',
        'category.id',
        'category.name',
        'category.slug',
        'tags.id',
        'tags.name',
        'tags.slug',
      ]);

    if (search) {
      qb.andWhere(
        '(post.title LIKE :search OR post.content LIKE :search OR post.excerpt LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (categoryId) {
      qb.andWhere('post.category_id = :categoryId', { categoryId });
    }

    if (tagId) {
      qb.andWhere('tags.id = :tagId', { tagId });
    }

    if (authorId) {
      qb.andWhere('post.author_id = :authorId', { authorId });
    }

    qb.orderBy('post.published_at', 'DESC');

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    const result = {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
      fromCache: false,
    };

    await this.redisService.set(cacheKey, result, CACHE_TTL);

    return result;
  }

  async findMyPosts(authorId: number, query: QueryPostDto) {
    const { status, page = 1, limit = 10 } = query;

    const qb = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.tags', 'tags')
      .where('post.author_id = :authorId', { authorId })
      .andWhere('post.is_deleted = false');

    if (status) {
      qb.andWhere('post.status = :status', { status });
    }

    qb.orderBy('post.created_at', 'DESC');

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

  async findOne(
    slug: string,
    userId?: number,
    userRole?: string,
  ): Promise<Post> {
    const qb = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.tags', 'tags')
      .where('post.slug = :slug', { slug })
      .andWhere('post.is_deleted = false');

    const isOwnerOrAdmin =
      userRole === UserRole.ADMIN || userRole === UserRole.AUTHOR;

    if (!isOwnerOrAdmin) {
      qb.andWhere('post.status = :status', {
        status: PostStatus.PUBLISHED,
      });
    }

    const post = await qb.getOne();

    if (!post) {
      throw new NotFoundException(`Post "${slug}" not found`);
    }

    if (
      post.status !== PostStatus.PUBLISHED &&
      userRole === UserRole.AUTHOR &&
      post.authorId !== userId
    ) {
      throw new ForbiddenException('You can only view your own drafts');
    }

    if (post.status === PostStatus.PUBLISHED) {
      await this.postRepository.increment({ id: post.id }, 'viewCount', 1);
      post.viewCount += 1;
    }

    return post;
  }

  async findOneById(id: number): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!post) {
      throw new NotFoundException(`Post #${id} not found`);
    }
    return post;
  }

  async update(
    slug: string,
    userId: number,
    userRole: string,
    dto: UpdatePostDto,
  ): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { slug, isDeleted: false },
      relations: ['tags'],
    });

    if (!post) {
      throw new NotFoundException(`Post "${slug}" not found`);
    }

    if (userRole !== UserRole.ADMIN && post.authorId !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    if (dto.categoryId) {
      await this.categoriesService.findOne(dto.categoryId);
    }

    if (dto.tagIds !== undefined) {
      await Promise.all(
        post.tags.map((tag) => this.tagsService.decrementPostCount(tag.id)),
      );
      const newTags = await this.tagsService.findByIds(dto.tagIds);
      post.tags = newTags;
      await Promise.all(
        newTags.map((tag) => this.tagsService.incrementPostCount(tag.id)),
      );
    }

    if (
      dto.status === PostStatus.PUBLISHED &&
      post.status !== PostStatus.PUBLISHED
    ) {
      post.publishedAt = new Date();
    }

    Object.assign(post, { ...dto, tags: post.tags });

    return this.postRepository.save(post);
  }

  async publish(
    slug: string,
    userId: number,
    userRole: string,
  ): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { slug, isDeleted: false },
    });

    if (!post) {
      throw new NotFoundException(`Post "${slug}" not found`);
    }

    if (userRole !== UserRole.ADMIN && post.authorId !== userId) {
      throw new ForbiddenException('You can only publish your own posts');
    }

    if (post.status === PostStatus.PUBLISHED) {
      throw new BadRequestException('Post is already published');
    }

    post.status = PostStatus.PUBLISHED;
    post.publishedAt = new Date();

    const saved = await this.postRepository.save(post);

    await this.clearPostsCache();

    return saved;
  }

  async archive(
    slug: string,
    userId: number,
    userRole: string,
  ): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { slug, isDeleted: false },
    });

    if (!post) {
      throw new NotFoundException(`Post "${slug}" not found`);
    }

    if (userRole !== UserRole.ADMIN && post.authorId !== userId) {
      throw new ForbiddenException('You can only archive your own posts');
    }

    post.status = PostStatus.ARCHIVED;
    const saved = await this.postRepository.save(post);

    await this.clearPostsCache();

    return saved;
  }

  async remove(
    slug: string,
    userId: number,
    userRole: string,
  ): Promise<{ message: string }> {
    const post = await this.postRepository.findOne({
      where: { slug, isDeleted: false },
      relations: ['tags'],
    });

    if (!post) {
      throw new NotFoundException(`Post "${slug}" not found`);
    }

    if (userRole !== UserRole.ADMIN && post.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await Promise.all(
      post.tags.map((tag) => this.tagsService.decrementPostCount(tag.id)),
    );

    post.isDeleted = true;
    await this.postRepository.save(post);

    await this.clearPostsCache();

    return { message: 'Post deleted successfully' };
  }

  async likePost(slug: string): Promise<{ likeCount: number }> {
    const post = await this.postRepository.findOne({
      where: { slug, isDeleted: false, status: PostStatus.PUBLISHED },
    });

    if (!post) {
      throw new NotFoundException(`Post "${slug}" not found`);
    }

    await this.postRepository.increment({ id: post.id }, 'likeCount', 1);

    return { likeCount: post.likeCount + 1 };
  }

  async incrementCommentCount(postId: number): Promise<void> {
    await this.postRepository.increment({ id: postId }, 'commentCount', 1);
  }

  async decrementCommentCount(postId: number): Promise<void> {
    await this.postRepository.decrement({ id: postId }, 'commentCount', 1);
  }
}