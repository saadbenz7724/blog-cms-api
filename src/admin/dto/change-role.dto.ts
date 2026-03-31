import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/user.entity';

export class ChangeRoleDto {
  @ApiProperty({
    enum: UserRole,
    example: UserRole.AUTHOR,
    description: 'New role to assign to user',
  })
  @IsEnum(UserRole)
  role!: UserRole;
}