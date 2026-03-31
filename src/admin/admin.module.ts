import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Post } from '../posts/post.entity';
import { Comment } from '../comments/comment.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Post, Comment]),
    UsersModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}