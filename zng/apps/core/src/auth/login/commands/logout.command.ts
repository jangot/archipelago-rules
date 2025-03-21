import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LogoutCommand } from './login.commands';
import { LoginBaseCommandHandler } from './login.base.command-handler';
import { UserLoginPayloadDto } from '../../../dto/response/user-login-payload.dto';

@CommandHandler(LogoutCommand)
export class LogoutCommandHandler extends LoginBaseCommandHandler<LogoutCommand> implements ICommandHandler<LogoutCommand> {
  public async execute(command: LogoutCommand): Promise<UserLoginPayloadDto> {
    const {
      payload: { userId },
    } = command;

    if (!userId) {
      this.logger.error('LogoutCommand: No userId provided');
      throw new Error('No userId provided');
    }

    const login = await this.domainServices.userServices.getCurrentUserLogin(userId);

    if (!login) {
      this.logger.error('LogoutCommand: No login found');
      throw new Error('No login found');
    }

    this.logger.debug(`logout: Logging out user: ${userId}`);
    // TODO: Invalidate the JWT token by removing it from the database or marking it as invalid

    login.secret = null;

    await this.domainServices.userServices.updateLogin(login.id, login);

    return { userId };
  }
}
