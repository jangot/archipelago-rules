import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LogoutCommand } from './login.commands';
import { LoginBaseCommandHandler } from './login.base.command-handler';
import { MissingInputException } from '@library/shared/common/exceptions/domain';
import { UserLoginPayloadDto } from '@core/dto';

@CommandHandler(LogoutCommand)
export class LogoutCommandHandler extends LoginBaseCommandHandler<LogoutCommand> implements ICommandHandler<LogoutCommand> {
  public async execute(command: LogoutCommand): Promise<UserLoginPayloadDto> {
    const {
      payload: { userId, accessToken },
    } = command;

    if (!userId || !accessToken) {
      this.logger.error('LogoutCommand: No userId or accessToken provided');
      throw new MissingInputException('No userId or accessToken provided');
    }

    this.logger.debug(`logout: Logging out user: ${userId}`);
    await this.domainServices.userServices.logoutUser(userId, accessToken);

    return { userId };
  }
}
