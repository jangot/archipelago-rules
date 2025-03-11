import { Body, Controller, Post, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  JwtResponseDto,
  OrganicRegistrationRequestDto,
  PasswordVerificationDto,
  RegistrationDto,
  SandboxRegistrationRequestDto,
} from '../dto';
import { UserRegisterResponseDto } from '../dto/response/user-register-response.dto';
import { UserVerificationRequestDto } from '../dto/request/user-verification-request.dto';
import { ApiBody, ApiExtraModels, ApiTags, getSchemaPath } from '@nestjs/swagger';
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
  @ApiExtraModels(OrganicRegistrationRequestDto, SandboxRegistrationRequestDto)
  @ApiBody({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(OrganicRegistrationRequestDto) },
        { $ref: getSchemaPath(SandboxRegistrationRequestDto) },
      ],
    },
  })
  async register(@Body() authRequest: RegistrationDto): Promise<UserRegisterResponseDto> {
    return await this.registrationService.register(authRequest);
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

    return await this.registrationService.verifyRegistration(id, verificationCode, verificationState);
  }
}
