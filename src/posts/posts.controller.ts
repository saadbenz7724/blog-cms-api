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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}


  @Get()
  @ApiOperation({ summary: 'Get all published posts — Redis cached 5 min' })
  @ApiResponse({ status: 200, description: 'Paginated published posts' })
  @ApiQuery({ name: 'search', required: false, example: 'nestjs' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({ name: 'tagId', required: false, type: Number })
  @ApiQuery({ name: 'authorId', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query() query: QueryPostDto) {
    return this.postsService.findAll(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get single post by slug — auto increments view count' })
  @ApiResponse({ status: 200, description: 'Post details with tags and category' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  findOne(@Param('slug') slug: string, @Request() req: any) {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    return this.postsService.findOne(slug, userId, userRole);
  }


  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @Post()
  @ApiOperation({ summary: 'Create a new post — Author or Admin only' })
  @ApiResponse({ status: 201, description: 'Post created with tags attached' })
  @ApiResponse({ status: 400, description: 'Invalid tag IDs' })
  create(@CurrentUser() user: User, @Body() dto: CreatePostDto) {
    return this.postsService.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @Get('my/posts')
  @ApiOperation({ summary: 'Get my posts including drafts — Author or Admin' })
  @ApiResponse({ status: 200, description: 'Author post list with all statuses' })
  getMyPosts(@CurrentUser() user: User, @Query() query: QueryPostDto) {
    return this.postsService.findMyPosts(user.id, query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @Patch(':slug')
  @ApiOperation({ summary: 'Update a post — owner or admin only' })
  @ApiResponse({ status: 200, description: 'Post updated' })
  @ApiResponse({ status: 403, description: 'You can only update your own posts' })
  update(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(slug, user.id, user.role, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @Patch(':slug/publish')
  @ApiOperation({ summary: 'Publish a draft post — clears Redis cache' })
  @ApiResponse({ status: 200, description: 'Post published' })
  @ApiResponse({ status: 400, description: 'Post already published' })
  publish(@CurrentUser() user: User, @Param('slug') slug: string) {
    return this.postsService.publish(slug, user.id, user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @Patch(':slug/archive')
  @ApiOperation({ summary: 'Archive a published post — clears Redis cache' })
  @ApiResponse({ status: 200, description: 'Post archived' })
  archive(@CurrentUser() user: User, @Param('slug') slug: string) {
    return this.postsService.archive(slug, user.id, user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @Delete(':slug')
  @ApiOperation({ summary: 'Soft delete a post' })
  @ApiResponse({ status: 200, description: 'Post soft deleted' })
  remove(@CurrentUser() user: User, @Param('slug') slug: string) {
    return this.postsService.remove(slug, user.id, user.role);
  }


  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post(':slug/like')
  @ApiOperation({ summary: 'Like a post — any logged in user' })
  @ApiResponse({ status: 200, description: 'Like count incremented' })
  likePost(@Param('slug') slug: string) {
    return this.postsService.likePost(slug);
  }
}