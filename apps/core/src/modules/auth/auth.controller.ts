import { LoginRequestDto } from '@core/modules/auth/dto/request/login.request.dto';
import { LoginVerifyRequestDto } from '@core/modules/auth/dto/request/login.verify.request.dto';
import { RegistrationDto, RegistrationRequestDto, RegistrationUpdateRequestDto, RegistrationVerifyRequestDto } from '@core/modules/auth/dto/request/registration.request.dto';
import { UserLoginPayloadDto } from '@core/modules/auth/dto/response/user-login-payload.dto';
import { UserRegisterResponseDto } from '@core/modules/auth/dto/response/user-register-response.dto';
import { ApiStatusResponseDto } from '@library/shared/common/dto/response/api.status.dto';
import { ILogoutRequest, IRefreshTokenRequest, IRequest } from '@library/shared/type';
import { BadRequestException, Body, Controller, Get, HttpException, HttpStatus, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiAcceptedResponse, ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiExtraModels, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse, getSchemaPath } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard, LogoutAuthGuard } from './guards';
import { RefreshTokenAuthGuard } from './guards/jwt-refresh.guard';
import { RegistrationService } from './registration.service';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly registrationService: RegistrationService
  ) {}

  //#region Login/Verify/Logout/Refresh
  @Post('login')
  @ApiOperation({ description: 'User Login', summary: 'Begins user login with Phone number or Email, pending successful code verification' })
  @ApiOkResponse({ description: 'User Login', type: UserLoginPayloadDto, isArray: false })
  @ApiBadRequestResponse({ description: 'Invalid Login Request', isArray: false })
  @ApiNotFoundResponse({ description: 'User not found for contact info', isArray: false })
  @ApiAcceptedResponse({ description: 'User has not completed Registration', isArray: false })
  @ApiBody({ type: LoginRequestDto, schema: { $ref: getSchemaPath(LoginRequestDto) } })
  async login(@Body() body: LoginRequestDto): Promise<UserLoginPayloadDto> {
    if ((!body.email && !body.phoneNumber) || (body.email && body.phoneNumber)) {
      throw new BadRequestException('A valid email or phone number (but not both) must be provided to login.');
    }

    return this.authService.initiateLoginSession(body);
  }

  @Post('verify')
  @ApiOperation({
    description: 'User Login Verification',
    summary: 'Completes user login with Phone number or Email by using verification code provided',
  })
  @ApiOkResponse({ description: 'User Login Verification', type: UserLoginPayloadDto, isArray: false })
  @ApiBadRequestResponse({ description: 'Invalid Verify Request', isArray: false })
  @ApiNotFoundResponse({ description: 'User not found for contact info', isArray: false })
  @ApiAcceptedResponse({ description: 'User has not completed Registration', isArray: false })
  @ApiForbiddenResponse({ description: 'User has not initiated a Login session or code has expired', isArray: false })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error', isArray: false })
  @ApiExtraModels(LoginVerifyRequestDto, LoginRequestDto)
  public async verify(@Body() body: LoginVerifyRequestDto): Promise<UserLoginPayloadDto> {    
    return this.authService.verifyLoginSession(body);
  }

  @Post('logout')
  @ApiOperation({ description: 'User Logout', summary: 'Ends user session and invalidates JWT token' })
  @ApiOkResponse({ description: 'User Logout', type: UserLoginPayloadDto, isArray: false })
  @ApiBadRequestResponse({ description: 'Invalid Logout Request', isArray: false })
  @ApiUnauthorizedResponse({ description: 'Invalid Access Token / User not Logged in', isArray: false })
  @ApiBearerAuth('jwt')
  @UseGuards(LogoutAuthGuard)
  public async logout(@Req() request: ILogoutRequest): Promise<UserLoginPayloadDto> {
    if (!request.user) {
      throw new HttpException('Invalid Access Token. Did not pass verification', HttpStatus.UNAUTHORIZED);
    }

    const userId = request.user.userId;
    const accessToken = request.user.sessionId;

    if (!userId || !accessToken) {
      throw new HttpException('Invalid Access Token. Not all data provided', HttpStatus.UNAUTHORIZED);
    }

    return this.authService.logout(userId, accessToken);
  }

  @Get('refresh')
  @ApiOperation({
    description: 'Refresh JWT AccessToken and RefreshToken',
    summary: 'Refresh JWT AccessToken and RefreshToken using RefreshToken provided',
  })
  @ApiOkResponse({ description: 'Get new User Access Token', type: UserLoginPayloadDto, isArray: false })
  @ApiBadRequestResponse({ description: 'Invalid Refresh Token Request', isArray: false })
  @ApiNotFoundResponse({ description: 'User or Refresh Token not found', isArray: false })
  @ApiUnauthorizedResponse({ description: 'Invalid Refresh Token', isArray: false })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error', isArray: false })
  @ApiUnauthorizedResponse({ description: 'Refresh Token has expired', isArray: false })
  @ApiBearerAuth('jwt')
  @UseGuards(RefreshTokenAuthGuard)
  refreshTokens(@Req() req: IRefreshTokenRequest): Promise<UserLoginPayloadDto> {
    if (!req.user) {
      throw new HttpException('Invalid Refresh Token. Did not pass verification', HttpStatus.UNAUTHORIZED);
    }
    const userId = req.user.userId;
    const refreshToken = req.user.secret;

    if (!userId || !refreshToken) {
      throw new HttpException('Invalid Refresh Token. Not all data provided', HttpStatus.UNAUTHORIZED);
    }

    return this.authService.refreshTokens(userId, refreshToken);
  }
  //#endregion

  //#region Registration
  @Post('register')
  @ApiOperation({
    description: 'Initiates User Registration or re-initiates User Registration',
    summary: 'Initiates User Registration or renew existing registration if Email and Phone Number were not verified yet',
  })
  @ApiOkResponse({ description: 'Initiate User Registration', type: UserRegisterResponseDto, isArray: false })
  @ApiBadRequestResponse({ description: 'Invalid Registration Request parameters', isArray: false })
  @ApiNotFoundResponse({ description: 'No registration found for user', isArray: false })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error', isArray: false })
  @ApiExtraModels(RegistrationRequestDto)
  @ApiBody({ schema: { $ref: getSchemaPath(RegistrationRequestDto) } })
  public async register(@Body() body: RegistrationDto): Promise<UserRegisterResponseDto> {
    return this.registrationService.register(body);
  }

  @Put('register')
  @ApiOperation({ description: 'Update Email or Phone number', summary: 'Update Email or Phone number during user registration' })
  @ApiOkResponse({ description: 'Update Email or Phone number', type: UserRegisterResponseDto, isArray: false })
  @ApiBadRequestResponse({ description: 'Invalid Registration Update Request parameters', isArray: false })
  @ApiNotFoundResponse({ description: 'User not found or no Registration found for user', isArray: false })
  @ApiBearerAuth('jwt')
  @ApiBody({ type: RegistrationUpdateRequestDto, schema: { $ref: getSchemaPath(RegistrationUpdateRequestDto) } })
  @UseGuards(JwtAuthGuard)
  public async updateVerificationField(@Body() body: RegistrationUpdateRequestDto, 
    @Req() request: IRequest): Promise<UserRegisterResponseDto | null> {
    const userId = request.user?.id;
    return this.registrationService.updateRegistrationContact(body, userId);
  }

  // Calling /register/verify again after sending initial code
  // will trigger the generation of a new code and a resend (no need for retry)
  // Making this an unAuthenticated endpoint in all cases... Not worth making it 1/2 and 1/2
  @Post('register/verify')
  @ApiOperation({
    description: 'Verify Email or Phone Number User Registration',
    summary: 'Verify Email or Phone Number User Registration with provided code',
  })
  @ApiOkResponse({ description: 'Verify Email or Phone Number User Registration', type: UserLoginPayloadDto, isArray: false })
  @ApiBadRequestResponse({ description: 'Invalid Registration Verify Request parameters', isArray: false })
  @ApiNotFoundResponse({ description: 'User / secret not found or no Registration found for user', isArray: false })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error', isArray: false })
  @ApiExtraModels(RegistrationVerifyRequestDto, UserLoginPayloadDto, ApiStatusResponseDto)
  @ApiBody({ type: RegistrationVerifyRequestDto, schema: { $ref: getSchemaPath(RegistrationVerifyRequestDto) } })
  public async verifyRegistration(@Body() body: RegistrationVerifyRequestDto): Promise<UserLoginPayloadDto | ApiStatusResponseDto | null> {
    return this.registrationService.verifyRegistration(body);
  }
}
//#endregion
