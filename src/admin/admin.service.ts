import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../users/user.entity';
import { Post, PostStatus } from '../posts/post.entity';
import { Comment } from '../comments/comment.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    private usersService: UsersService,
  ) {}

  async getAllUsers() {
    return this.userRepository.find({
      select: [
        'id',
        'fullName',
        'email',
        'role',
        'status',
        'bio',
        'createdAt',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async getUserById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'fullName',
        'email',
        'role',
        'status',
        'bio',
        'createdAt',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    const postCount = await this.postRepository.count({
      where: { authorId: id, isDeleted: false },
    });

    const commentCount = await this.commentRepository.count({
      where: { userId: id, isDeleted: false },
    });

    return { ...user, stats: { postCount, commentCount } };
  }

  async banUser(id: number, adminId: number) {
    if (id === adminId) {
      throw new BadRequestException('You cannot ban yourself');
    }

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('You cannot ban another admin');
    }

    if (user.status === UserStatus.BANNED) {
      throw new BadRequestException('User is already banned');
    }

    user.status = UserStatus.BANNED;
    await this.userRepository.save(user);

    return { message: `User "${user.fullName}" has been banned` };
  }

  async unbanUser(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('User is not banned');
    }

    user.status = UserStatus.ACTIVE;
    await this.userRepository.save(user);

    return { message: `User "${user.fullName}" has been unbanned` };
  }

  async changeUserRole(id: number, role: UserRole, adminId: number) {
    if (id === adminId) {
      throw new BadRequestException('You cannot change your own role');
    }

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    if (user.role === role) {
      throw new BadRequestException(`User already has role: ${role}`);
    }

    user.role = role;
    await this.userRepository.save(user);

    return {
      message: `User "${user.fullName}" role changed to ${role}`,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  async getAllPosts(status?: PostStatus) {
    const qb = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category')
      .where('post.is_deleted = false')
      .select([
        'post.id',
        'post.title',
        'post.slug',
        'post.status',
        'post.likeCount',
        'post.viewCount',
        'post.commentCount',
        'post.createdAt',
        'post.publishedAt',
        'author.id',
        'author.fullName',
        'author.email',
        'category.id',
        'category.name',
      ])
      .orderBy('post.created_at', 'DESC');

    if (status) {
      qb.andWhere('post.status = :status', { status });
    }

    return qb.getMany();
  }

  async forceDeletePost(id: number) {
    const post = await this.postRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!post) {
      throw new NotFoundException(`Post #${id} not found`);
    }

    post.isDeleted = true;
    await this.postRepository.save(post);

    return { message: `Post "${post.title}" has been deleted` };
  }

  async getAllComments() {
    return this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.post', 'post')
      .select([
        'comment.id',
        'comment.content',
        'comment.likeCount',
        'comment.isDeleted',
        'comment.createdAt',
        'user.id',
        'user.fullName',
        'post.id',
        'post.title',
        'post.slug',
      ])
      .orderBy('comment.created_at', 'DESC')
      .getMany();
  }

  async forceDeleteComment(id: number) {
    const comment = await this.commentRepository.findOne({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(`Comment #${id} not found`);
    }

    comment.isDeleted = true;
    await this.commentRepository.save(comment);

    return { message: `Comment #${id} has been deleted` };
  }

  async getDashboardStats() {
    const [
      totalUsers,
      totalPosts,
      totalComments,
      publishedPosts,
      draftPosts,
      bannedUsers,
      authorCount,
      readerCount,
    ] = await Promise.all([
      this.userRepository.count(),

      this.postRepository.count({ where: { isDeleted: false } }),

      this.commentRepository.count({ where: { isDeleted: false } }),

      this.postRepository.count({
        where: { status: PostStatus.PUBLISHED, isDeleted: false },
      }),

      this.postRepository.count({
        where: { status: PostStatus.DRAFT, isDeleted: false },
      }),

      this.userRepository.count({
        where: { status: UserStatus.BANNED },
      }),

      this.userRepository.count({ where: { role: UserRole.AUTHOR } }),

      this.userRepository.count({ where: { role: UserRole.READER } }),
    ]);

    const topPosts = await this.postRepository.find({
      where: { isDeleted: false, status: PostStatus.PUBLISHED },
      order: { likeCount: 'DESC' },
      take: 5,
      select: ['id', 'title', 'slug', 'likeCount', 'viewCount', 'commentCount'],
    });

    const recentUsers = await this.userRepository.find({
      order: { createdAt: 'DESC' },
      take: 5,
      select: ['id', 'fullName', 'email', 'role', 'createdAt'],
    });

    return {
      overview: {
        totalUsers,
        totalPosts,
        totalComments,
        bannedUsers,
      },
      userBreakdown: {
        admins: totalUsers - authorCount - readerCount - bannedUsers,
        authors: authorCount,
        readers: readerCount,
        banned: bannedUsers,
      },
      postBreakdown: {
        published: publishedPosts,
        drafts: draftPosts,
        archived: totalPosts - publishedPosts - draftPosts,
      },
      topPosts,
      recentUsers,
      generatedAt: new Date().toISOString(),
    };
  }
}