import { LoginBaseCommandHandler } from './login.base.command-handler';
import { LoginOnContactVerifiedCommand } from './login.commands';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserLoginPayloadDto } from '../../../dto/response/user-login-payload.dto';

@CommandHandler(LoginOnContactVerifiedCommand)
export class LoginOnContactVerifiedCommandHandler
  extends LoginBaseCommandHandler<LoginOnContactVerifiedCommand>
  implements ICommandHandler<LoginOnContactVerifiedCommand>
{
  public async execute(command: LoginOnContactVerifiedCommand): Promise<UserLoginPayloadDto> {
    const {
      payload: { userId, loginId, contactType },
    } = command;

    if (!userId) {
      this.logger.error('LoginOnContactVerifiedCommand: No userId provided');
      throw new Error('No userId provided');
    }

    const result = await this.generateLoginPayload(userId, contactType || '', undefined);
    if (loginId) {
      const updatedLogin = { id: loginId, updatedAt: new Date(), secret: result.refreshToken, secretExpiresAt: result.refreshTokenExpiresIn };
      // Update userLogin secret and secretExpiresAt
      await this.domainServices.userServices.updateLogin(loginId, updatedLogin, true);
    }

    return result;
  }
}
