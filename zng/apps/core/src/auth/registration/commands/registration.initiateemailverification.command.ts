import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegistrationBaseCommandHandler } from './registration.base.command-handler';
import { InitiateEmailVerificationCommand } from './registration.commands';
import { ContactType, RegistrationStatus } from '@library/entity/enum';
import { VerificationEvent } from '../../verification';
import { RegistrationTransitionMessage, RegistrationTransitionResult } from '@library/shared/types';
import { logSafeRegistration, logSafeUser } from '@library/shared/common/helpers';
import { MissingInputException } from '@library/shared/common/exceptions/domain';

@CommandHandler(InitiateEmailVerificationCommand)
export class InitiateEmailVerificationCommandHandler
  extends RegistrationBaseCommandHandler<InitiateEmailVerificationCommand>
  implements ICommandHandler<InitiateEmailVerificationCommand> {
  public async execute(command: InitiateEmailVerificationCommand): Promise<RegistrationTransitionResult> {
    if (!command || !command.payload || !command.payload.input) {
      this.logger.warn('initiateEmailVerification: Invalid command payload', { command });
      return this.createTransitionResult(RegistrationStatus.NotRegistered, false, RegistrationTransitionMessage.WrongInput);
    }
    const {
      payload: { id: userId, input },
    } = command;

    // #region Input and User validation
    if (!userId) {
      throw new MissingInputException('User id cannot be null when requesting email verification.');
    }

    const user = await this.domainServices.userServices.getUserById(userId);
    if (!user) {
      this.logger.debug(`No user found by ${userId}`);
      return this.createTransitionResult(RegistrationStatus.NotRegistered, false, RegistrationTransitionMessage.WrongInput);
    }

    const { email } = input;
    if (!email) {
      this.logger.warn('No email provided for email verification', { input });
      return this.createTransitionResult(RegistrationStatus.NotRegistered, false, RegistrationTransitionMessage.NoContactProvided);
    }

    const userByEmail = await this.domainServices.userServices.getUserByContact(email, ContactType.EMAIL);

    if (userByEmail) {
      if (userByEmail.id === userId) {
        this.logger.debug(`User ${userId} already has the email ${email}`);
        return this.createTransitionResult(RegistrationStatus.EmailVerified, false, RegistrationTransitionMessage.AlreadyVerified);
      }
      this.logger.debug(`Email already taken: ${email} by ${userByEmail.id}`, { input });
      return this.createTransitionResult(RegistrationStatus.EmailVerifying, false, RegistrationTransitionMessage.ContactTaken);
    }

    const registration = await this.domainServices.userServices.getUserRegistration(userId);
    if (!registration) {
      this.logger.warn(`No registration found for user ${userId}`);
      return this.createTransitionResult(RegistrationStatus.NotRegistered, false, RegistrationTransitionMessage.NoRegistrationStatusFound);
    }

    // #endregion

    // #region Generating Code, Updating User and Registration
    const { code, expiresAt } = this.domainServices.userServices.generateCode();

    this.logger.debug(`About to update registration during adding email for user ${userId}`, {
      user: logSafeUser(user),
      registration: logSafeRegistration(registration),
    });

    registration.secret = code;
    registration.secretExpiresAt = expiresAt;
    registration.status = RegistrationStatus.EmailVerifying;

    user.pendingEmail = email;
    user.email = null;
    user.registrationStatus = RegistrationStatus.EmailVerifying;

    this.logger.debug('Updated registration and user data before apply', {
      user: logSafeUser(user),
      registration: logSafeRegistration(registration),
    });

    await this.domainServices.userServices.updateUserRegistration(registration, user);

    this.logger.debug(`Updated registration during adding phone number for user ${userId}`);

    // #endregion

    this.sendEvent(user, VerificationEvent.EmailVerifying);

    return this.createTransitionResult(RegistrationStatus.EmailVerifying, true, null, userId, undefined, code);
  }
}
