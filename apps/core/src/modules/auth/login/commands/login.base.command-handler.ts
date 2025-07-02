import { LoginCommand } from './login.commands';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { ContactType, LoginType } from '@library/entity/enum';
import { ConfigService } from '@nestjs/config';
import { UserLoginPayloadDto } from '../../dto/response/user-login-payload.dto';
import { IDomainServices } from '@core/modules/domain/idomain.services';

@Injectable()
export abstract class LoginBaseCommandHandler<TCommand extends LoginCommand = LoginCommand> {
  protected readonly domainServices: IDomainServices;
  protected readonly jwtService: JwtService;
  protected readonly logger: Logger;
  protected readonly eventBus: EventBus;
  protected readonly config: ConfigService;

  constructor(domainServices: IDomainServices, jwtService: JwtService, logger: Logger, eventBus: EventBus, config: ConfigService) {
    this.domainServices = domainServices;
    this.jwtService = jwtService;
    this.logger = logger;
    this.eventBus = eventBus;
    this.config = config;
  }

  public abstract execute(command: TCommand): Promise<UserLoginPayloadDto>;

  protected async generateLoginPayload(userId: string, onboardingStatus: string, expiresIn?: number): Promise<UserLoginPayloadDto> {
    const payload = this.domainServices.userServices.createAccessTokenPayload(userId);
    const refreshPayload = this.domainServices.userServices.createRefreshTokenPayload(userId);

    const accessTokenExp = expiresIn || this.config.getOrThrow<number>('JWT_ACCESS_EXP');
    const refreshTokenExp = this.config.getOrThrow<number>('JWT_REFRESH_EXP');

    const accessToken = await this.domainServices.userServices.generateAccessToken(payload, accessTokenExp);
    const refreshToken = await this.domainServices.userServices.generateRefreshToken(refreshPayload, refreshTokenExp);

    const result: UserLoginPayloadDto = {
      userId,
      onboardingStatus,
      accessToken,
      refreshToken,
      accessTokenExpiresIn: new Date(payload!.exp! * 1000),
      refreshTokenExpiresIn: new Date(refreshPayload!.exp! * 1000),
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
