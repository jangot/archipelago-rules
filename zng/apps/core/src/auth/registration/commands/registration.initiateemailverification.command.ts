import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegistrationBaseCommandHandler } from './registration.base.command-handler';
import { InitiateEmailVerificationCommand } from './registration.commands';
import { ContactType, RegistrationStatus } from '@library/entity/enum';
import { VerificationEvent } from '../../verification';
import { RegistrationTransitionMessage, RegistrationTransitionResult } from '@library/shared/types';

@CommandHandler(InitiateEmailVerificationCommand)
export class InitiateEmailVerificationCommandHandler
  extends RegistrationBaseCommandHandler<InitiateEmailVerificationCommand>
  implements ICommandHandler<InitiateEmailVerificationCommand>
{
  public async execute(command: InitiateEmailVerificationCommand): Promise<RegistrationTransitionResult> {
    const {
      payload: { id: userId, input },
    } = command;

    // #region Input and User validation
    if (!userId) {
      throw new Error('User id cannot be null when requesting email verification.');
    }

    if (!input) {
      throw new Error('input cannot be null when requesting email verification.');
    }

    const user = await this.domainServices.userServices.getUserById(userId);
    if (!user) {
      return this.createTransitionResult(
        RegistrationStatus.NotRegistered,
        false,
        RegistrationTransitionMessage.WrongInput
      );
    }

    const { email } = input;
    if (!email) {
      return this.createTransitionResult(
        RegistrationStatus.NotRegistered,
        false,
        RegistrationTransitionMessage.NoContactProvided
      );
    }

    const userByEmail = await this.domainServices.userServices.getUserByContact(email, ContactType.EMAIL);

    if (userByEmail) {
      if (userByEmail.id === userId) {
        return this.createTransitionResult(
          RegistrationStatus.EmailVerified,
          false,
          RegistrationTransitionMessage.AlreadyVerified
        );
      }
      return this.createTransitionResult(
        RegistrationStatus.EmailVerifying,
        false,
        RegistrationTransitionMessage.ContactTaken
      );
    }

    const registration = await this.domainServices.userServices.getUserRegistration(userId);
    if (!registration) {
      return this.createTransitionResult(
        RegistrationStatus.NotRegistered,
        false,
        RegistrationTransitionMessage.NoRegistrationStatusFound
      );
    }

    // #endregion

    // #region Generating Code, Updating User and Registration
    const { code: verificationCode, expiresAt: verificationCodeExpiresAt } = this.generateCode();

    this.logger.debug(`About to update registration during adding email for user ${userId}`, {
      user,
      registration: { ...registration, secret: '***' },
    });

    registration.secret = verificationCode;
    registration.secretExpiresAt = verificationCodeExpiresAt;
    registration.status = RegistrationStatus.EmailVerifying;

    user.pendingEmail = email;
    user.email = null;
    user.registrationStatus = RegistrationStatus.EmailVerifying;

    this.logger.debug(`Updated registration and user data before apply`, {
      user,
      registration: { ...registration, secret: '***' },
    });

    await this.domainServices.userServices.updateUserRegistration(registration, user);

    this.logger.debug(`Updated registration during adding phone number for user ${userId}`);

    // #endregion

    this.sendEvent(user, VerificationEvent.EmailVerifying);

    return this.createTransitionResult(RegistrationStatus.EmailVerifying, true, null, userId, verificationCode);
  }
}
