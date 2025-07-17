import { IDomainServices } from '@core/modules/domain/idomain.services';
import { ContactType, LoginType, VerificationType } from '@library/entity/enum';
import { EventManager } from '@library/shared/common/event/event-manager';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserLoginPayloadDto } from '../../dto/response';
import { LoginCommand } from './login.commands';

@Injectable()
export abstract class LoginBaseCommandHandler<TCommand extends LoginCommand = LoginCommand> {
  
  constructor(protected readonly domainServices: IDomainServices, protected readonly jwtService: JwtService, protected readonly logger: Logger, 
    protected readonly eventManager: EventManager, protected readonly config: ConfigService) {
  }

  public abstract execute(command: TCommand): Promise<UserLoginPayloadDto>;

  protected async generateLoginPayload(userId: string, onboardStatus: string, expiresIn?: number): Promise<UserLoginPayloadDto> {
    const payload = this.domainServices.userServices.createAccessTokenPayload(userId);
    const refreshPayload = this.domainServices.userServices.createRefreshTokenPayload(userId);

    const accessTokenExp = expiresIn || this.config.getOrThrow<number>('JWT_ACCESS_EXP');
    const refreshTokenExp = this.config.getOrThrow<number>('JWT_REFRESH_EXP');

    const accessToken = await this.domainServices.userServices.generateAccessToken(payload, accessTokenExp);
    const refreshToken = await this.domainServices.userServices.generateRefreshToken(refreshPayload, refreshTokenExp);

    const result: UserLoginPayloadDto = {
      userId,
      onboardStatus,
      accessToken,
      refreshToken,
      accessTokenExpiresAt: new Date(payload!.exp! * 1000),
      refreshTokenExpiresAt: new Date(refreshPayload!.exp! * 1000),
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

  protected getLoginTypeByVerificationType(verificationType: VerificationType): LoginType | null {
    switch (verificationType) {
      case VerificationType.Email:
        return LoginType.OneTimeCodeEmail;
      case VerificationType.PhoneNumber:
        return LoginType.OneTimeCodePhoneNumber;
      default:
        return null;
    }
  }

  protected isDevelopmentEnvironment(): boolean {
    return this.config.get<string>('NODE_ENV', 'production') === 'development';
  }
}
