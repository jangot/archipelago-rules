import { Body, Controller, Post, Req, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  JwtResponseDto,
  OrganicRegistrationAdvanceRequestDto,
  OrganicRegistrationRequestDto,
  OrganicRegistrationVerifyRequestDto,
  RegistrationDto,
  SandboxRegistrationRequestDto,
} from '../dto';
import { UserRegisterResponseDto } from '../dto/response/user-register-response.dto';
import { ApiBearerAuth, ApiBody, ApiExtraModels, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { RegistrationService } from './registration.service';
import { ExtractJwt } from 'passport-jwt';
import { JwtType, RegistrationStatus } from '@library/entity/enum';

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

  @Post('register/advance')
  @ApiBearerAuth()
  @ApiExtraModels(OrganicRegistrationAdvanceRequestDto, SandboxRegistrationRequestDto)
  @ApiBody({
    type: OrganicRegistrationAdvanceRequestDto,
    schema: { $ref: getSchemaPath(OrganicRegistrationAdvanceRequestDto) },
  })
  async advanceRegistration(@Body() body: RegistrationDto, @Req() request: Request): Promise<UserRegisterResponseDto> {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
    if (!token) throw new UnauthorizedException('Unauthorized');

    const isTokenValid = await this.authService.verifyJwtSignature(token, JwtType.Login);
    if (!isTokenValid) throw new UnauthorizedException('JWT token mismatch');

    return await this.registrationService.advanceRegistration(body);
  }

  @ApiExtraModels(OrganicRegistrationVerifyRequestDto, JwtResponseDto)
  @ApiBody({
    type: OrganicRegistrationVerifyRequestDto,
    schema: { $ref: getSchemaPath(OrganicRegistrationVerifyRequestDto) },
  })
  @Post('register/verify') // registration verification
  async verifyRegistration(
    @Body() body: OrganicRegistrationVerifyRequestDto,
    @Req() request: Request
  ): Promise<JwtResponseDto | null> {
    //TODO: !! Add support of 'retry' verification
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
    if (!token) return await this.registrationService.verifyRegistration(body);

    const isTokenValid = await this.authService.verifyJwtSignature(token, JwtType.Login);
    if (!isTokenValid) throw new UnauthorizedException('JWT token mismatch');

    const payload = this.authService.decodeToken(token);
    if (!payload) throw new UnauthorizedException('Invalid token');
    if (payload.registration !== RegistrationStatus.PhoneNumberVerifying)
      throw new UnauthorizedException('Invalid registration status');
    return await this.registrationService.verifyAdvanceRegistration(body);
  }
}
