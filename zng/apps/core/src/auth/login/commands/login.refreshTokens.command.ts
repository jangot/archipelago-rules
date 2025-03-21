import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserLoginPayloadDto } from 'apps/core/src/dto/response/user-login-payload.dto';
import { LoginBaseCommandHandler } from './login.base.command-handler';
import { RefreshTokenCommand } from './login.commands';

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenCommandHandler extends LoginBaseCommandHandler<RefreshTokenCommand> implements ICommandHandler<RefreshTokenCommand> {
  public async execute(command: RefreshTokenCommand): Promise<UserLoginPayloadDto> {
    const { userId, refreshToken } = command.payload;

    if (!userId || !refreshToken) {
      this.logger.error('RefreshTokenCommand: No userId or refreshToken provided');
      throw new Error('No userId or refreshToken provided');
    }

    const user = await this.domainServices.userServices.getUserById(userId);
    if (!user) {
      this.logger.error('RefreshTokenCommand: No user found');
      throw new Error('No user found');
    }
    const login = await this.domainServices.userServices.getUserLoginForRefreshToken(userId, refreshToken);
    if (!login) {
      this.logger.error('RefreshTokenCommand: No login found');
      throw new Error('No login found');
    }

    const result = await this.generateLoginPayload(userId, user.onboardStatus || '');

    const { refreshToken: newRefreshToken, refreshTokenExpiresIn } = result;
    if (!newRefreshToken || !refreshTokenExpiresIn) {
      this.logger.error(`RefreshTokenCommand: Refresh token or its expiration time is not generated for user ${userId}`);
      throw new Error('Refresh token or its expiration time is not generated');
    }

    login.updatedAt = new Date();
    login.secret = newRefreshToken;
    login.secretExpiresAt = refreshTokenExpiresIn;

    const updateResult = await this.domainServices.userServices.updateLogin(login.id, login, true);
    if (!updateResult) {
      this.logger.error('RefreshTokenCommand: Could not update login');
      throw new Error('Could not update login');
    }

    return result;
  }
}
