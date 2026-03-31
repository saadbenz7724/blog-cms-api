import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.usersService.create({
      fullName: dto.fullName,
      email: dto.email,
      password: hashedPassword,
      role: dto.role,
      bio: dto.bio,
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    return {
      message: 'Registration successful',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshToken(token: string) {
    const savedToken = await this.refreshTokenRepository.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!savedToken) {
      throw new UnauthorizedException('Refresh token not found');
    }
    if (savedToken.isRevoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }
    if (new Date() > savedToken.expiresAt) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    savedToken.isRevoked = true;
    await this.refreshTokenRepository.save(savedToken);

    const tokens = await this.generateTokens(
      savedToken.user.id,
      savedToken.user.email,
      savedToken.user.role,
    );

    return {
      message: 'Token refreshed successfully',
      ...tokens,
    };
  }

  async logout(token: string) {
    const savedToken = await this.refreshTokenRepository.findOne({
      where: { token },
    });

    if (!savedToken) {
      throw new BadRequestException('Refresh token not found');
    }

    savedToken.isRevoked = true;
    await this.refreshTokenRepository.save(savedToken);

    return { message: 'Logged out successfully' };
  }

  private async generateTokens(
    userId: number,
    email: string,
    role: string,
  ) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const tokenEntity = this.refreshTokenRepository.create({
      token: refreshToken,
      userId,
      expiresAt,
      isRevoked: false,
    });
    await this.refreshTokenRepository.save(tokenEntity);

    return { accessToken, refreshToken };
  }
}