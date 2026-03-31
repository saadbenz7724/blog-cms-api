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
import { AdminService } from './admin.service';
import { ChangeRoleDto } from './dto/change-role.dto';
import { AdminQueryPostsDto } from './dto/query-posts.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/user.entity';
import { User } from '../users/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}


  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardStats();
  }


  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('users/:id')
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/ban')
  banUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: User,
  ) {
    return this.adminService.banUser(id, admin.id);
  }

  @Patch('users/:id/unban')
  unbanUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.unbanUser(id);
  }

  @Patch('users/:id/role')
  changeRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeRoleDto,
    @CurrentUser() admin: User,
  ) {
    return this.adminService.changeUserRole(id, dto.role, admin.id);
  }


  @Get('posts')
  getAllPosts(@Query() query: AdminQueryPostsDto) {
    return this.adminService.getAllPosts(query.status);
  }

  @Delete('posts/:id')
  forceDeletePost(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.forceDeletePost(id);
  }

  @Get('comments')
  getAllComments() {
    return this.adminService.getAllComments();
  }

  @Delete('comments/:id')
  forceDeleteComment(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.forceDeleteComment(id);
  }
}