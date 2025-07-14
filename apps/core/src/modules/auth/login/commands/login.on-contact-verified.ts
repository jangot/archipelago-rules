import { ContactType, RegistrationStatus } from '@library/entity/enum';
import { MissingInputException } from '@library/shared/common/exception/domain';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserLoginPayloadDto } from '../../dto/response/user-login-payload.dto';
import { LoginBaseCommandHandler } from './login.base.command-handler';
import { LoginOnContactVerifiedCommand } from './login.commands';

@CommandHandler(LoginOnContactVerifiedCommand)
export class LoginOnContactVerifiedCommandHandler
  extends LoginBaseCommandHandler<LoginOnContactVerifiedCommand>
  implements ICommandHandler<LoginOnContactVerifiedCommand> {
  public async execute(command: LoginOnContactVerifiedCommand): Promise<UserLoginPayloadDto> {
    const { payload: { userId, loginId, contactType } } = command;

    if (!userId) {
      this.logger.error(`LoginOnContactVerifiedCommand: No userId provided for ${contactType}`);
      throw new MissingInputException('No userId provided');
    }

    const onboardStatus = contactType === ContactType.EMAIL ? RegistrationStatus.EmailVerified : RegistrationStatus.PhoneNumberVerified;
    const result = await this.generateLoginPayload(userId, onboardStatus, undefined);
    if (loginId) {
      const updatedLogin = { id: loginId, updatedAt: new Date(), secret: result.refreshToken, secretExpiresAt: 
      result.refreshTokenExpiresAt, sessionId: result.accessToken };
      // Update userLogin secret, secretExpiresAt, and sessionId
      await this.domainServices.userServices.updateLogin(loginId, updatedLogin, true);
    }

    return result;
  }
}
