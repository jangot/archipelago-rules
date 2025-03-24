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

    this.logger.debug(`logout: Logging out user: ${userId}`);
    await this.domainServices.userServices.logoutUser(userId);

    return { userId };
  }
}
