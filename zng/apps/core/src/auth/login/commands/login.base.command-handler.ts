import { LoginCommand } from './login.commands';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { UserLoginPayloadDto } from '../../../dto/response/user-login-payload.dto';
import { ContactType, LoginType } from '@library/entity/enum';
import { IDomainServices } from '../../../domain/idomain.services';

export abstract class LoginBaseCommandHandler<TCommand extends LoginCommand = LoginCommand> {
  protected readonly domainServices: IDomainServices;
  protected readonly jwtService: JwtService;
  protected readonly logger: Logger;
  protected readonly eventBus: EventBus;

  constructor(domainServices: IDomainServices, jwtService: JwtService, logger: Logger, eventBus: EventBus) {
    this.domainServices = domainServices;
    this.jwtService = jwtService;
    this.logger = logger;
    this.eventBus = eventBus;
  }

  public abstract execute(command: TCommand): Promise<UserLoginPayloadDto>;

  protected async generateLoginPayload(
    userId: string,
    onboardingStatus: string,
    expiresIn?: string,
    loginId?: string
  ): Promise<UserLoginPayloadDto> {
    const payload = this.domainServices.userServices.createAccessTokenPayload(userId, loginId);
    const refreshTokenPayload = this.domainServices.userServices.createRefreshTokenPayload(userId, loginId);

    // Default to 1 hour unless we override this
    if (!expiresIn) {
      expiresIn = '1h';
    }

    const accessToken = await this.domainServices.userServices.generateToken(payload, expiresIn);
    const refreshToken = await this.domainServices.userServices.generateToken(refreshTokenPayload, expiresIn);

    const result: UserLoginPayloadDto = {
      userId,
      onboardingStatus,
      accessToken,
      refreshToken,
    };

    return result;
  }

  protected getLoginTypeByContactType(contactType: ContactType): LoginType | null {
    switch (contactType) {
      case ContactType.EMAIL:
        return LoginType.OneTimeCodeEmail;
      case ContactType.PHONE_NUMBER:
        return LoginType.OneTimeCodePhoneNumber;
      case ContactType.PENDING_EMAIL:
      case ContactType.PENDING_PHONE_NUMBER:
      default:
        return null;
    }
  }
}
