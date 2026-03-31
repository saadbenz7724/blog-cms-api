import { IsEnum } from 'class-validator';
import { UserRole } from '../../users/user.entity';

export class ChangeRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}