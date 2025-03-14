import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegistrationBaseCommandHandler } from './registration.base.command-handler';
import { InitiateEmailVerificationCommand } from './registration.commands';
import { RegistrationTransitionMessage, RegistrationTransitionResultDto } from '../../../dto';
import { ContactType, RegistrationStatus } from '@library/entity/enum';
import { generateSecureCode } from '@library/shared/common/helpers';
import { Transactional } from 'typeorm-transactional';
import { ApplicationUser, UserRegistration } from '../../../data/entity';
import { VerificationEvent } from '../../verification';

@CommandHandler(InitiateEmailVerificationCommand)
export class InitiateEmailVerificationCommandHandler
  extends RegistrationBaseCommandHandler<InitiateEmailVerificationCommand>
  implements ICommandHandler<InitiateEmailVerificationCommand>
{
  public async execute(command: InitiateEmailVerificationCommand): Promise<RegistrationTransitionResultDto> {
    const {
      payload: { id: userId, input },
    } = command;

    // #region Input and User validation
    if (!userId) {
      throw new Error('User id cannot be null when requesting email verification.');
    }

    const user = await this.data.users.getUserById(userId);
    if (!user) {
      return this.createTransitionResult(
        RegistrationStatus.NotRegistered,
        false,
        RegistrationTransitionMessage.WrongInput
      );
    }

    if (!input) {
      throw new Error('input cannot be null when requesting email verification.');
    }

    const { email } = input;

    if (!email) {
      return this.createTransitionResult(
        RegistrationStatus.NotRegistered,
        false,
        RegistrationTransitionMessage.NoContactProvided
      );
    }

    const userByEmail = await this.data.users.getUserByContact(email, ContactType.EMAIL);

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

    const registration = await this.getUserRegistration(userId);
    if (!registration) {
      return this.createTransitionResult(
        RegistrationStatus.NotRegistered,
        false,
        RegistrationTransitionMessage.NoRegistrationStatusFound
      );
    }

    // #endregion

    // #region Generating Code, Updating User and Registration
    const verificationCode = generateSecureCode(6); // Generate new Verification code
    const verificationCodeExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour expiration for now

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

    await this.updateData(registration, user);

    this.logger.debug(`Updated registration during adding phone number for user ${userId}`);

    // #endregion

    this.sendEvent(user, VerificationEvent.EmailVerifying);

    return this.createTransitionResult(RegistrationStatus.EmailVerifying, true, null, userId, verificationCode);
  }

  @Transactional()
  private async updateData(registration: UserRegistration, user: ApplicationUser): Promise<void> {
    await Promise.all([
      this.data.userRegistrations.update(registration.id, registration),
      this.data.users.update(user.id, user),
    ]);
  }
}
