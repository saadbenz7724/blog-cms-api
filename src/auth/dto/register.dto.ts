import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { UserRole } from '../../users/user.entity';

export class RegisterDto {
  @IsString()
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum([UserRole.AUTHOR, UserRole.READER])
  role!: UserRole;

  @IsOptional()
  @IsString()
  bio?: string;
}