import { Body, Controller, HttpException, HttpStatus, Post, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtResponseDto, PasswordVerificationDto } from '../dto';
import { RegistrationRequestDTO } from '../dto/request/registration.request.dto';
import { UserRegisterResponseDto } from '../dto/response/user-register-response.dto';
import { UserVerificationRequestDto } from '../dto/request/user-verification-request.dto';
import { ApiTags } from '@nestjs/swagger';
import { RegistrationService } from './registration.service';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly registrationService: RegistrationService
  ) {}

  // TODO: extend to support different login flows.
  @Post('login')
  async login(@Body() body: PasswordVerificationDto, @Request() req): Promise<JwtResponseDto> {
    // Shouldn't this come from the body parameter?
    return await this.authService.login(req.user.id);
  }

  //@UseGuards(PasswordAuthGuard)
  // MOCK. Endpoint to accept login verification
  @Post('verify') // --> for login
  async verify(): Promise<unknown> {
    return true;
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

    return await this.registrationService.register(firstName, lastName, email, phoneNumber);
  }

  // MOCK. Endpoint to accept second contact verification call
  @Post('register/advance')
  async advanceRegistration(): Promise<unknown> {
    return true;
  }

  // TODO?: Add Guard that accepts either anonymous (for 1st contact verification) or JWT (for 2nd contact verification)
  @Post('register/verify') // !!! --> registration verification
  async verifyRegistration(
    @Body() body: UserVerificationRequestDto
  ): Promise<JwtResponseDto | UserRegisterResponseDto | null> {
    const { id, verificationCode, verificationState } = body;

    return await this.registrationService.verify(id, verificationCode, verificationState);
  }
}
