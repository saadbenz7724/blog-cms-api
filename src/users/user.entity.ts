import { RefreshToken } from 'src/auth/refresh-token.entity';
import { Comment } from 'src/comments/comment.entity';
import { Post } from 'src/posts/post.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  AUTHOR = 'author',
  READER = 'reader',
}

export enum UserStatus {
  ACTIVE = 'active',
  BANNED = 'banned',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'full_name' })
  fullName!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.READER,
  })
  role!: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Column({ nullable: true })
  bio!: string;

  @Column({ nullable: true })
  avatar!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Post, (post) => post.author)
  posts!: Post[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments!: Comment[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];
}