import { BadRequestException, Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PasswordAuthGuard } from './guards';
import { JwtResponseDto, PasswordVerificationDto, UserRegisterRequestDto } from '../dto';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {}

  @UseGuards(PasswordAuthGuard)
  @Post('login')
  async login(@Body() body: PasswordVerificationDto, @Request() req): Promise<JwtResponseDto> {
    return this.authService.login(req.user.id);
  }

  @Post('register')
  async register(@Body() body: UserRegisterRequestDto): Promise<JwtResponseDto> {
    const { email, phoneNumber, password } = body;

    const isNewUser = await this.usersService.isNewUser(email, phoneNumber);
    if (!isNewUser) {
      throw new BadRequestException('existing_contact'); // TODO: Error message codes dictionary would be nice to have
    }

    const createResult = await this.usersService.createUser(body);
    if (!createResult) {
      throw new BadRequestException('failed_to_create_user');
    }

    const { id } = createResult;
    const passwordLinkResult = await this.authService.linkPasswordSecret(id, password);
    if (!passwordLinkResult) {
      throw new BadRequestException('failed_to_link_password');
    }

    return passwordLinkResult;
  }
}
