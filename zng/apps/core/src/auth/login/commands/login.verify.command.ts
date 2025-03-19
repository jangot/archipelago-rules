import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoginBaseCommandHandler } from './login.base.command-handler';
import { LoginVerifyCommand } from './login.commands';
import { UserLoginPayloadDto } from 'apps/core/src/dto/response/user-login-payload.dto';
import { ContactType, RegistrationStatus } from '@library/entity/enum';

@CommandHandler(LoginVerifyCommand)
export class LoginVerifyCommandHandler
  extends LoginBaseCommandHandler<LoginVerifyCommand>
  implements ICommandHandler<LoginVerifyCommand>
{
  public async execute(command: LoginVerifyCommand): Promise<UserLoginPayloadDto> {
    const {
      payload: { userId, contact, contactType, verificationCode },
    } = command;

    //TODO: This should be refactored as it is the same code as in the LoginInitiateCommandHandler

    // Either userId or contact must be provided as well as Command execution should be provided with contact type by caller
    if (!userId && !contact) {
      this.logger.error('LoginInitiateCommand: No userId or contact provided');
      throw new Error('No userId or contact provided');
    }

    const user = userId
      ? await this.domainServices.userServices.getUserById(userId)
      : contact && contactType
        ? await this.domainServices.userServices.getUserByContact(contact, contactType)
        : null;

    if (!user) {
      this.logger.warn('LoginInitiateCommand: No user found');
      throw new Error('No user found');
    }

    const { registrationStatus } = user;
    if (
      (contactType !== ContactType.EMAIL || registrationStatus !== RegistrationStatus.EmailVerified) &&
      registrationStatus !== RegistrationStatus.Registered
    ) {
      this.logger.warn('LoginInitiateCommand: User is not registered to Log In');
      throw new Error('User is not registered to log in');
    }

    const loginType = this.getLoginTypeByContactType(contactType || ContactType.EMAIL);
    const login = await this.domainServices.userServices.getUserLoginByType(user.id, loginType!);

    if (!login) {
      this.logger.warn('LoginInitiateCommand: No login found');
      throw new Error('No login found');
    }

    const { secret, secretExpiresAt } = login;

    if (!secret) {
      this.logger.warn('LoginInitiateCommand: No secret found');
      throw new Error('Login session is not initiated');
    }

    if (secretExpiresAt && secretExpiresAt < new Date()) {
      this.logger.warn('LoginInitiateCommand: Secret expired');
      throw new Error('Login session is expired');
    }

    if (secret !== verificationCode) {
      this.logger.warn('LoginInitiateCommand: Verification code mismatch');
      throw new Error('Verification code mismatch');
    }

    const result = this.generateLoginPayload(user.id, login.id, user.onboardStatus || '');

    login.secret = null;
    login.secretExpiresAt = null;

    // TODO: Add JWT secret updates when Refresh token is implemented

    // TODO: publish event
    // this.eventBus.publish()

    return result;
  }
}
