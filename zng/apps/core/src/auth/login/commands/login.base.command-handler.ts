import { IDataService } from '../../../data/idata.service';
import { LoginCommand } from './login.commands';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { UserLoginPayloadDto } from '../../../dto/response/user-login-payload.dto';
import { JwtPayloadDto } from '../../../dto';
import { generateSecureCode } from '@library/shared/common/helpers';

export abstract class LoginBaseCommandHandler<TCommand extends LoginCommand = LoginCommand> {
  protected readonly data: IDataService;
  protected readonly jwtService: JwtService;
  protected readonly logger: Logger;
  protected readonly eventBus: EventBus;

  constructor(data: IDataService, jwtService: JwtService, logger: Logger, eventBus: EventBus) {
    this.data = data;
    this.jwtService = jwtService;
    this.logger = logger;
    this.eventBus = eventBus;
  }

  public abstract execute(command: TCommand): Promise<UserLoginPayloadDto>;

  protected generateLoginPayload(userId: string, onboardingStatus: string, expiresIn?: string): UserLoginPayloadDto {
    const exp = Math.floor((Date.now() + 3600000) / 1000); // 1 hour expiration in Unix Epoch time
    const iat = Math.floor(Date.now() / 1000); // Current dateTime in Unix Epoch time
    const payload: JwtPayloadDto = {
      iss: 'https://auth.zirtue.com',
      sub: userId,
      aud: 'api-zirtue.com',
      exp: exp,
      iat: iat,
      scope: 'read write profile',
      isAdmin: false,
    };

    // Default to 1 hour unless we override this
    if (!expiresIn) {
      expiresIn = '1h';
    }

    const accessToken = this.jwtService.sign(payload, { expiresIn });

    const result: UserLoginPayloadDto = {
      userId,
      onboardingStatus,
      accessToken,
    };

    return result;
  }

  protected generateCode(): { code: string; expiresAt: Date } {
    const code = generateSecureCode(6);
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour expiration for now
    return { code, expiresAt };
  }
}
