import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserLoginPayloadDto } from 'apps/core/src/dto/response/user-login-payload.dto';
import { LoginBaseCommandHandler } from './login.base.command-handler';
import { RefreshTokenCommand } from './login.commands';

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenCommandHandler
  extends LoginBaseCommandHandler<RefreshTokenCommand>
  implements ICommandHandler<RefreshTokenCommand>
{
  public async execute(command: RefreshTokenCommand): Promise<UserLoginPayloadDto> {
    const { userId, loginId } = command.payload;

    if (!userId || !loginId) {
      this.logger.error('RefreshTokenCommand: No userId or loginId provided');
      throw new Error('No userId or loginId provided');
    }

    const user = await this.domainServices.userServices.getUserById(userId);
    if (!user) {
      this.logger.error('RefreshTokenCommand: No user found');
      throw new Error('No user found');
    }
    const login = await this.domainServices.userServices.getUserLoginById(loginId);
    if (!login) {
      this.logger.error('RefreshTokenCommand: No login found');
      throw new Error('No login found');
    }

    const result = await this.generateLoginPayload(userId, user.onboardStatus || '');

    login.updatedAt = new Date();
    login.secret = result.refreshToken!;
    login.secretExpiresAt = result.refreshTokenExpiresIn!;

    const updateResult = await this.domainServices.userServices.updateLogin(loginId, login, true);
    if (!updateResult) {
      this.logger.error('RefreshTokenCommand: Could not update login');
      throw new Error('Could not update login');
    }

    return result;
  }
}
