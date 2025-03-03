import { BadRequestException, Body, Controller, Post, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PasswordAuthGuard } from './guards';
import { JwtResponseDto, PasswordVerificationDto, RegistrationDto } from '../dto';
import { UsersService } from '../users/users.service';
import { JwtType } from '@library/entity/enum';
import { RegistrationFactory } from './registration.factory';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly registrationFactory: RegistrationFactory
  ) {}

  @UseGuards(PasswordAuthGuard)
  @Post('login')
  async login(@Body() body: PasswordVerificationDto, @Request() req): Promise<JwtResponseDto> {
    return this.authService.login(req.user.id);
  }

  @Post('register')
  async register(@Body() body: RegistrationDto, @Request() req: Request): Promise<void> {
    if (!body) {
      throw new BadRequestException('missing_registration_body');
    }

    const { type } = body;
    const token = req.headers.get('Authorization');

    // Call should either initiate registration with 'type' or continue existed with token
    if (!type && !token) {
      throw new BadRequestException('missing_both_registration_type_and_token');
    }

    // If Authorization token provided - verify it
    if (token) {
      const isTokenValid = await this.authService.verifyJwtSignature(token, JwtType.Registration);
      if (!isTokenValid) {
        throw new UnauthorizedException('invalid_registration_token');
      }
    }

    return this.registrationFactory.advance(body, token);
  }
}
