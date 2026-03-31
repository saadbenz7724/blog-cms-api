import { Post } from 'src/posts/post.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
} from 'typeorm';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true })
  slug!: string;

  @Column({ name: 'post_count', default: 0 })
  postCount!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToMany(() => Post, (post) => post.tags)
  posts!: Post[];
}