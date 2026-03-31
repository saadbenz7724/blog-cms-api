import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../users/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'John Author' })
  @IsString()
  fullName!: string;

  @ApiProperty({ example: 'author@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    enum: [UserRole.AUTHOR, UserRole.READER],
    example: UserRole.AUTHOR,
    description: 'Only author or reader allowed. Admin is assigned manually.',
  })
  @IsEnum([UserRole.AUTHOR, UserRole.READER])
  role!: UserRole;

  @ApiPropertyOptional({ example: 'I write about backend development' })
  @IsOptional()
  @IsString()
  bio?: string;
}