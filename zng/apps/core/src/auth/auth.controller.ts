import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  JwtResponseDto,
  OrganicRegistrationRequestDto,
  OrganicRegistrationVerifyRequestDto,
  RegistrationDto,
  SandboxRegistrationRequestDto,
} from '../dto';
import { UserRegisterResponseDto } from '../dto/response/user-register-response.dto';
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
  // @Post('login')
  // async login(@Body() body: PasswordVerificationDto, @Request() req): Promise<JwtResponseDto> {
  //   // Shouldn't this come from the body parameter?
  //   return await this.authService.login(req.user.id);
  // }

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
  async register(@Body() body: RegistrationDto): Promise<UserRegisterResponseDto> {
    return await this.registrationService.register(body);
  }

  // MOCK. Endpoint to accept second contact verification call
  @Post('register/advance')
  async advanceRegistration(): Promise<unknown> {
    return true;
  }

  // TODO?: Add Guard that accepts either anonymous (for 1st contact verification) or JWT (for 2nd contact verification)
  @ApiExtraModels(OrganicRegistrationVerifyRequestDto, JwtResponseDto)
  @ApiBody({ schema: { $ref: getSchemaPath(OrganicRegistrationVerifyRequestDto) } })
  @Post('register/verify') // registration verification
  async verifyRegistration(@Body() body: RegistrationDto): Promise<JwtResponseDto | null> {
    //TODO: !! Add support of 'retry' verification
    return await this.registrationService.verifyRegistration(body);
  }
}
