import { Body, Controller, HttpException, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PasswordAuthGuard } from './guards';
import { JwtResponseDto, PasswordVerificationDto } from '../dto';
import { RegistrationRequestDTO } from '../dto/request/registration.request.dto';
import { UserRegisterResponseDto } from '../dto/response/user-register-response.dto';
import { UserVerificationRequestDto } from '../dto/request/user-verification-request.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(PasswordAuthGuard)
  @Post('login')
  async login(@Body() body: PasswordVerificationDto, @Request() req): Promise<JwtResponseDto> {
    // Shouldn't this come from the body parameter?
    return await this.authService.login(req.user.id);
  }

  @Post('register')
  async register(@Body() authRequest: RegistrationRequestDTO): Promise<UserRegisterResponseDto> {
    if (!authRequest.isValid()) {
      throw new HttpException(
        `Invalid registration request. You must provide either an email or a phone number.`,
        HttpStatus.BAD_REQUEST
      );
    }

    const { firstName, lastName, email, phoneNumber } = authRequest;

    return await this.authService.register(firstName, lastName, email, phoneNumber);
  }

  @Post('verify')
  async verify(@Body() body: UserVerificationRequestDto): Promise<JwtResponseDto | UserRegisterResponseDto | null> {
    const { id, verificationCode, verificationState } = body;

    return await this.authService.verify(id, verificationCode, verificationState);
  }
}
