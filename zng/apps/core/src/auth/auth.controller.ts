import { Body, Controller, Get, HttpException, HttpStatus, Post, Put, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegistrationRequestDto, RegistrationVerifyRequestDto, RegistrationDto, RegistrationUpdateRequestDto, LoginVerifyRequestDto } from '../dto';
import { UserRegisterResponseDto } from '../dto/response/user-register-response.dto';
import { ApiBearerAuth, ApiBody, ApiExtraModels, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { RegistrationService } from './registration.service';
import { JwtAuthGuard } from './guards';
import { UserLoginPayloadDto } from '../dto/response/user-login-payload.dto';
import { LoginRequestDto } from '../dto/request/login.request.dto';
import { RefreshTokenAuthGuard } from './guards/jwt-refresh.guard';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly registrationService: RegistrationService
  ) {}

  @Post('login')
  @ApiOperation({ description: 'User Login', summary: 'Begins user login with Phone number or Email, pending successful code verification' })
  @ApiBody({ type: LoginRequestDto, schema: { $ref: getSchemaPath(LoginRequestDto) } })
  async login(@Body() body: LoginRequestDto): Promise<UserLoginPayloadDto> {
    return this.authService.initiateLoginSession(body);
  }

  @Post('verify')
  @ApiOperation({
    description: 'User Login Verification',
    summary: 'Completes user login with Phone number or Email by using verification code provided',
  })
  public async verify(@Body() body: LoginVerifyRequestDto): Promise<UserLoginPayloadDto> {
    return this.authService.verifyLoginSession(body);
  }

  @Post('logout')
  @ApiOperation({ description: 'User Logout', summary: 'Ends user session and invalidates JWT token' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  public async logout(@Req() request: Request): Promise<unknown> {
    const userId = request.user?.id;
    // Technically, this should never happen, but just in case
    if (!userId) {
      throw new HttpException('User is not logged in.', HttpStatus.UNAUTHORIZED);
    }

    return this.authService.logout(userId);
  }

  @Get('refresh')
  @ApiOperation({
    description: 'Refresh JWT AccessToken and RefreshToken',
    summary: 'Refresh JWT AccessToken and RefreshToken using RefreshToken provided',
  })
  @UseGuards(RefreshTokenAuthGuard)
  refreshTokens(@Req() req: Request) {
    if (!req.user) {
      throw new HttpException('Invalid Refresh Token.', HttpStatus.UNAUTHORIZED);
    }

    const userId = req.user['user_id'];
    const refreshToken = req.user['secret'];

    if (!userId || !refreshToken) {
      throw new HttpException('Invalid Refresh Token.', HttpStatus.UNAUTHORIZED);
    }

    return this.authService.refreshTokens(userId, refreshToken);
  }

  @Post('register')
  @ApiOperation({
    description: 'Initiates User Registration or re-initiates User Registration',
    summary: 'Initiates User Registration or renew existing registration if Email and Phone Number were not verified yet',
  })
  @ApiExtraModels(RegistrationRequestDto)
  @ApiBody({ schema: { $ref: getSchemaPath(RegistrationRequestDto) } })
  public async register(@Body() body: RegistrationDto): Promise<UserRegisterResponseDto> {
    return await this.registrationService.register(body);
  }

  @Put('register')
  @ApiOperation({ description: 'Update Email or Phone number', summary: 'Update Email or Phone number during user registration' })
  @ApiBearerAuth('jwt')
  @ApiBody({ type: RegistrationUpdateRequestDto, schema: { $ref: getSchemaPath(RegistrationUpdateRequestDto) } })
  @UseGuards(JwtAuthGuard)
  public async updateVerificationField(@Body() body: RegistrationUpdateRequestDto, @Req() request: Request): Promise<UserRegisterResponseDto | null> {
    const userId = request.user?.id;
    return await this.registrationService.updateRegistrationContact(body, userId);
  }

  // Calling /register/verify again after sending initial code
  // will trigger the generation of a new code and a resend (no need for retry)
  // Making this an unAuthenticated endpoint in all cases... Not worth making it 1/2 and 1/2
  @Post('register/verify')
  @ApiOperation({
    description: 'Verify Email or Phone Number User Registration',
    summary: 'Verify Email or Phone Number User Registration with provided code',
  })
  @ApiExtraModels(RegistrationVerifyRequestDto, UserLoginPayloadDto)
  @ApiBody({ type: RegistrationVerifyRequestDto, schema: { $ref: getSchemaPath(RegistrationVerifyRequestDto) } })
  public async verifyRegistration(@Body() body: RegistrationVerifyRequestDto): Promise<UserLoginPayloadDto | null> {
    return await this.registrationService.verifyRegistration(body);
  }
}
