import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { QueryCommentDto } from './dto/query-comment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';
import { CommentsService } from './comments.service';

@Controller('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}


  @Get('post/:postId')
  findByPost(
    @Param('postId', ParseIntPipe) postId: number,
    @Query() query: QueryCommentDto,
  ) {
    return this.commentsService.findByPost(postId, query);
  }


  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser() user: User,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.commentsService.remove(id, user.id, user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  likeComment(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.likeComment(id);
  }


  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@Query() query: QueryCommentDto) {
    return this.commentsService.findAll(query);
  }
}