import { CommandHandler, EventBus } from '@nestjs/cqrs';
import { IDataService } from 'apps/core/src/data/idata.service';
import { LoginCommand } from './login.commands';
import { UserLoginPayloadDto } from 'apps/core/src/dto/response/user-login-payload.dto';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { IApplicationUser } from '@library/entity/interface';
import { JwtPayloadDto } from 'apps/core/src/dto';
import { JwtService } from '@nestjs/jwt';
import { ContactType } from '@library/entity/enum';

@CommandHandler(LoginCommand)
export class LoginCommandHandler {
  constructor(
    private readonly data: IDataService,
    private readonly jwtService: JwtService,
    private readonly logger: Logger,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: LoginCommand): Promise<UserLoginPayloadDto> {
    const { userId, contact, contactType } = command;

    if (!userId && !contact) {
      this.logger.error('LoginCommand: No userId or contact provided');
      throw new Error('No userId or contact provided');
    }

    // If userId is provided, we will use it to login the user
    if (userId) {
      this.logger.debug(`LoginCommand: Logging in user by ID: ${userId}`);
      return this.loginById(userId);
    }

    if (contact && contactType) {
      this.logger.debug(`LoginCommand: Logging in user by contact: ${contact}`);
      return this.login(contact, contactType);
    }

    this.logger.error('LoginCommand: No userId or contact provided');
    throw new Error('No userId or contact provided');
  }

  async login(contact: string, contactType: ContactType, expiresIn?: string): Promise<UserLoginPayloadDto> {
    const user = await this.data.users.getUserByContact(contact, contactType);

    return this.loginWithUser(user, expiresIn);
  }

  // feels like to much opened to the world
  async loginById(id: string, expiresIn?: string): Promise<UserLoginPayloadDto> {
    this.logger.debug(`login: Logging in user: ${id}`);

    const user = await this.data.users.getUserById(id);
    return this.loginWithUser(user, expiresIn);
  }

  async loginWithUser(user: IApplicationUser | null, expiresIn?: string): Promise<UserLoginPayloadDto> {
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const result = this.generateLoginPayload(user.id, user.onboardStatus || '', expiresIn);

    return result;
  }

  private generateLoginPayload(userId: string, onboardingStatus: string, expiresIn?: string): UserLoginPayloadDto {
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
}
