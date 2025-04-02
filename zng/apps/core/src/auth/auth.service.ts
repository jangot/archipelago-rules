import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { LoginVerifyRequestDto } from '../dto';
import { ContactType } from '@library/entity/enum';
import { UserLoginPayloadDto } from '../dto/response/user-login-payload.dto';
import { LoginRequestDto } from '../dto/request/login.request.dto';
import { CommandBus } from '@nestjs/cqrs';
import { LoginInitiateCommand, LoginVerifyCommand, LogoutCommand, RefreshTokenCommand } from './login/commands';
import { safeTrim } from '@library/shared/common/helpers';
import { UserLoginResponseDTO } from '../dto/response/user-login-response.dto';

@Injectable()
export class AuthService {
  // Creating a Logger like this sets the Context, which will log the class name with the Log entries
  private readonly logger: Logger = new Logger(AuthService.name);

  constructor(private readonly commandBus: CommandBus) {}

  public async initiateLoginSession(request: LoginRequestDto): Promise<UserLoginResponseDTO> {
    const contactInfo = this.extractContactInfo(request);

    return await this.commandBus.execute(new LoginInitiateCommand({ contact: contactInfo.contact, contactType: contactInfo.contactType }));
  }

  public async verifyLoginSession(request: LoginVerifyRequestDto): Promise<UserLoginPayloadDto> {
    const contactInfo = this.extractContactInfo(request);

    return await this.commandBus.execute(
      new LoginVerifyCommand({
        userId: request.userId ?? undefined,
        contact: contactInfo.contact,
        contactType: contactInfo.contactType,
        verificationCode: request.code,
      })
    );
  }

  public async logout(userId: string, accessToken: string): Promise<UserLoginPayloadDto> {
    this.logger.debug(`logout: Logging out user: ${userId}`);
    // Invalidate the JWT token by removing it from the database or marking it as invalid
    const result = await this.commandBus.execute(new LogoutCommand({ userId, accessToken }));
    this.logger.debug(`User ${userId} logged out successfully`);

    return result;
  }

  public async refreshTokens(userId: string, refreshToken: string): Promise<UserLoginPayloadDto> {
    this.logger.debug(`refreshTokens: Refreshing tokens for user: ${userId}`);
    const result = await this.commandBus.execute(new RefreshTokenCommand({ userId, refreshToken }));

    return result;
  }

  private extractContactInfo(loginInfo: LoginRequestDto): { contact: string; contactType: ContactType } {
    const { email: emailRaw, phoneNumber: phoneNumberRaw } = loginInfo;
    const email = safeTrim(emailRaw);
    const phoneNumber = safeTrim(phoneNumberRaw);

    if (email && phoneNumber) {
      throw new BadRequestException('A valid email or phone number (but not both) must be provided to login.');
    }

    if (email) {
      return { contact: email, contactType: ContactType.EMAIL };
    } else if (phoneNumber) {
      return { contact: phoneNumber, contactType: ContactType.PHONE_NUMBER };
    }

    throw new BadRequestException('A valid email or phone number (but not both) must be provided to login.');
  }
}
