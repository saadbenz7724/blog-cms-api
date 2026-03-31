import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Category } from '../categories/category.entity';
import { Tag } from '../tags/tag.entity';
import { Comment } from 'src/comments/comment.entity';

export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ nullable: true })
  thumbnail!: string;

  @Column({ nullable: true })
  excerpt!: string;

  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.DRAFT,
  })
  status!: PostStatus;

  @Column({ name: 'like_count', default: 0 })
  likeCount!: number;

  @Column({ name: 'view_count', default: 0 })
  viewCount!: number;

  @Column({ name: 'comment_count', default: 0 })
  commentCount!: number;

  @Column({ name: 'published_at', nullable: true })
  publishedAt!: Date;

  @Column({ name: 'is_deleted', default: false })
  isDeleted!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @Column({ name: 'author_id' })
  authorId!: number;

  @ManyToOne(() => Category, (category) => category.posts)
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @Column({ name: 'category_id', nullable: true })
  categoryId!: number;

  @ManyToMany(() => Tag, (tag) => tag.posts, { cascade: true })
  @JoinTable({
    name: 'post_tags',
    joinColumn: {
      name: 'post_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'tag_id',
      referencedColumnName: 'id',
    },
  })
  tags!: Tag[];

  @OneToMany(() => Comment, (comment) => comment.post)
  comments!: Comment[];
}