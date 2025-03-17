import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoginInitiateCommand } from './login.commands';
import { LoginBaseCommandHandler } from './login.base.command-handler';
import { UserLoginPayloadDto } from 'apps/core/src/dto/response/user-login-payload.dto';
import { ContactType, LoginStatus, LoginType, RegistrationStatus } from '@library/entity/enum';

@CommandHandler(LoginInitiateCommand)
export class LoginInitiateCommandHandler
  extends LoginBaseCommandHandler<LoginInitiateCommand>
  implements ICommandHandler<LoginInitiateCommand>
{
  public async execute(command: LoginInitiateCommand): Promise<UserLoginPayloadDto> {
    const {
      payload: { userId, contact, contactType },
    } = command;

    // Either userId or contact must be provided as well as Command execution should be provided with contact type by caller
    if (!userId && !contact) {
      this.logger.error('LoginInitiateCommand: No userId or contact provided');
      throw new Error('No userId or contact provided');
    }

    const user = userId
      ? await this.data.users.getUserById(userId)
      : contact && contactType
        ? await this.data.users.getUserByContact(contact, contactType)
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

    const loginType = contactType === ContactType.EMAIL ? LoginType.OneTimeCodeEmail : LoginType.OneTimeCodePhoneNumber;
    const login = await this.data.logins.getUserSecretByType(user.id, loginType);

    if (!login) {
      this.logger.warn('LoginInitiateCommand: No login found');
      throw new Error('No login found');
    }

    const { code, expiresAt } = this.generateCode();

    login.code = code;
    login.expiresAt = expiresAt;
    login.loginStatus = LoginStatus.Verifying;

    await this.data.logins.update(login.id, login);

    // TODO: Send the code to the user
    //this.sendEvent()

    return { userId: user.id, verificationCode: code, accessToken: '', onboardingStatus: '' };
  }
}
