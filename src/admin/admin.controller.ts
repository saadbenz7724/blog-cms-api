import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { ChangeRoleDto } from './dto/change-role.dto';
import { AdminQueryPostsDto } from './dto/query-posts.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}


  @Get('dashboard')
  @ApiOperation({ summary: 'Get full admin dashboard stats' })
  @ApiResponse({ status: 200, description: 'Users, posts, comments overview' })
  @ApiResponse({ status: 403, description: 'Admin only' })
  getDashboard() {
    return this.adminService.getDashboardStats();
  }


  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Full user list with roles and status' })
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get single user with post and comment stats' })
  @ApiResponse({ status: 200, description: 'User details with activity stats' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/ban')
  @ApiOperation({ summary: 'Ban a user — banned users blocked at JWT level' })
  @ApiResponse({ status: 200, description: 'User banned' })
  @ApiResponse({ status: 400, description: 'Cannot ban yourself or another admin' })
  banUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: User,
  ) {
    return this.adminService.banUser(id, admin.id);
  }

  @Patch('users/:id/unban')
  @ApiOperation({ summary: 'Unban a user' })
  @ApiResponse({ status: 200, description: 'User unbanned' })
  unbanUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.unbanUser(id);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Change user role' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 400, description: 'Cannot change your own role' })
  changeRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeRoleDto,
    @CurrentUser() admin: User,
  ) {
    return this.adminService.changeUserRole(id, dto.role, admin.id);
  }


  @Get('posts')
  @ApiOperation({ summary: 'Get all posts including drafts and archived' })
  @ApiResponse({ status: 200, description: 'All posts with author info' })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'published', 'archived'] })
  getAllPosts(@Query() query: AdminQueryPostsDto) {
    return this.adminService.getAllPosts(query.status);
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: 'Force delete any post' })
  @ApiResponse({ status: 200, description: 'Post deleted' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  forceDeletePost(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.forceDeletePost(id);
  }

  @Get('comments')
  @ApiOperation({ summary: 'Get all comments across all posts' })
  @ApiResponse({ status: 200, description: 'All comments with user and post info' })
  getAllComments() {
    return this.adminService.getAllComments();
  }

  @Delete('comments/:id')
  @ApiOperation({ summary: 'Force delete any comment' })
  @ApiResponse({ status: 200, description: 'Comment deleted' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  forceDeleteComment(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.forceDeleteComment(id);
  }
}