import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';

@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}


  @Get()
  findAll(@Query() query: QueryPostDto) {
    return this.postsService.findAll(query);
  }

  @Get(':slug')
  findOne(
    @Param('slug') slug: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    return this.postsService.findOne(slug, userId, userRole);
  }


  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @Post()
  create(
    @CurrentUser() user: User,
    @Body() dto: CreatePostDto,
  ) {
    return this.postsService.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @Get('my/posts')
  getMyPosts(
    @CurrentUser() user: User,
    @Query() query: QueryPostDto,
  ) {
    return this.postsService.findMyPosts(user.id, query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @Patch(':slug')
  update(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(slug, user.id, user.role, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @Patch(':slug/publish')
  publish(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
  ) {
    return this.postsService.publish(slug, user.id, user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @Patch(':slug/archive')
  archive(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
  ) {
    return this.postsService.archive(slug, user.id, user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @Delete(':slug')
  remove(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
  ) {
    return this.postsService.remove(slug, user.id, user.role);
  }


  @UseGuards(JwtAuthGuard)
  @Post(':slug/like')
  likePost(@Param('slug') slug: string) {
    return this.postsService.likePost(slug);
  }
}