import { BadRequestException, Body, Controller, Post, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PasswordAuthGuard } from './guards';
import { JwtResponseDto, PasswordVerificationDto, RegistrationDto } from '../dto';
import { UsersService } from '../users/users.service';
import { JwtType } from '@library/entity/enum';
import { RegistrationFactory } from './registration.factory';
import { IDataService } from '../data/idata.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    protected readonly data: IDataService,
    protected readonly jwtService: JwtService,
    protected readonly config: ConfigService
  ) {}

  @UseGuards(PasswordAuthGuard)
  @Post('login')
  async login(@Body() body: PasswordVerificationDto, @Request() req): Promise<JwtResponseDto> {
    return this.authService.login(req.user.id);
  }

  @Post('register')
  async register(@Body() body: RegistrationDto, @Request() req: Request): Promise<unknown> {
    if (!body) {
      throw new BadRequestException('missing_registration_body');
    }

    const { type } = body;
    const token = req.headers.get('Authorization');

    // Call should either initiate registration with 'type' or continue existed with token
    if (!type && !token) {
      throw new BadRequestException('missing_both_registration_type_and_token');
    }

    // TODO: Remove?
    // If Authorization token provided - verify it
    if (token) {
      const isTokenValid = await this.authService.verifyJwtSignature(token, JwtType.Registration);
      if (!isTokenValid) {
        throw new UnauthorizedException('invalid_registration_token');
      }
    }

    const registrator = RegistrationFactory.getRegistrator(
      type,
      this.data,
      this.jwtService,
      this.config,
      this.usersService
    );

    if (!registrator) {
      throw new BadRequestException('invalid_registration_type');
    }

    return registrator.advance(body, token);
  }
}
