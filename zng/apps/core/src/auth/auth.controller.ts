import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PasswordAuthGuard } from './guards';
import { PasswordVerificationDto } from '../dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(PasswordAuthGuard)
  @Post('login')
  async login(@Body() body: PasswordVerificationDto, @Request() req) {
    return this.authService.login(req.user);
  }
}
