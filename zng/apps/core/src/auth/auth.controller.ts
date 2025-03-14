import { Body, Controller, Post, Put, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import {
  RegistrationRequestDto,
  RegistrationVerifyRequestDto,
  RegistrationDto,
  RegistrationUpdateRequestDto,
  LoginRequestDto,
} from '../dto';
import { UserRegisterResponseDto } from '../dto/response/user-register-response.dto';
import { ApiBearerAuth, ApiBody, ApiExtraModels, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { RegistrationService } from './registration.service';
import { JwtAuthGuard } from './guards';
import { UserLoginPayloadDto } from '../dto/response/user-login-payload.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly registrationService: RegistrationService
  ) {}

  @Post('login')
  @ApiOperation({
    description: 'User Login',
    summary: 'Begins user login with Phone number or Email, pending successful code verification',
  })
  @ApiBody({ type: LoginRequestDto, schema: { $ref: getSchemaPath(LoginRequestDto) } })
  async login(@Body() body: LoginRequestDto): Promise<UserLoginPayloadDto> {
    return this.authService.login(body);
  }

  @Post('verify') // --> for login
  public async verify(): Promise<unknown> {
    return true;
  }

  @Post('register')
  @ApiExtraModels(RegistrationRequestDto)
  @ApiBody({ schema: { $ref: getSchemaPath(RegistrationRequestDto) } })
  public async register(@Body() body: RegistrationDto): Promise<UserRegisterResponseDto> {
    return await this.registrationService.register(body);
  }

  @Put('register')
  @ApiOperation({
    description: 'Update Email or Phone number',
    summary: 'Update Email or Phone number during user registration',
  })
  @ApiBearerAuth()
  @ApiBody({ type: RegistrationUpdateRequestDto, schema: { $ref: getSchemaPath(RegistrationUpdateRequestDto) } })
  @UseGuards(JwtAuthGuard)
  public async updateVerificationField(
    @Body() body: RegistrationUpdateRequestDto,
    @Req() request: Request
  ): Promise<UserLoginPayloadDto | null> {
    const userId = request.user?.id;
    return await this.registrationService.verifyRegistration(body, userId);
  }

  // Calling /register/verify again after sending initial code
  // will trigger the generation of a new code and a resend (no need for retry)
  // Making this an unAuthenticated endpoint in all cases... Not worth making it 1/2 and 1/2
  @Post('register/verify') // registration verification
  @ApiExtraModels(RegistrationVerifyRequestDto, UserLoginPayloadDto)
  @ApiBody({
    type: RegistrationVerifyRequestDto,
    schema: { $ref: getSchemaPath(RegistrationVerifyRequestDto) },
  })
  public async verifyRegistration(@Body() body: RegistrationVerifyRequestDto): Promise<UserLoginPayloadDto | null> {
    return await this.registrationService.verifyRegistration(body);
  }
}
