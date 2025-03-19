import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegistrationBaseCommandHandler } from './registration.base.command-handler';
import { VerifyContactCommand } from './registration.commands';
import { LoginType, RegistrationStatus } from '@library/entity/enum';
import { VerificationEvent } from '../../verification';
import { RegistrationTransitionMessage, RegistrationTransitionResult } from '@library/shared/types';

const pendingStates: RegistrationStatus[] = [
  RegistrationStatus.EmailVerifying,
  RegistrationStatus.PhoneNumberVerifying,
];

@CommandHandler(VerifyContactCommand)
export class VerifyContactCommandHandler
  extends RegistrationBaseCommandHandler<VerifyContactCommand>
  implements ICommandHandler<VerifyContactCommand>
{
  public async execute(command: VerifyContactCommand): Promise<RegistrationTransitionResult> {
    const {
      payload: { id: userId, input },
    } = command;
    // #region Input validation
    if (!userId) {
      throw new Error('User id cannot be null when verifying contact.');
    }
    if (!input) {
      throw new Error('input cannot be null when verifying contact.');
    }
    // #endregion

    // #region Registration state validation
    const registration = await this.domainServices.userServices.getUserRegistration(userId);
    if (!registration) {
      return this.createTransitionResult(
        RegistrationStatus.NotRegistered,
        false,
        RegistrationTransitionMessage.NoRegistrationStatusFound
      );
    }
    const { status: existedRegistrationStatus } = registration;
    if (!pendingStates.includes(registration.status)) {
      return this.createTransitionResult(
        existedRegistrationStatus,
        false,
        RegistrationTransitionMessage.NotAwaitingForCode
      );
    }
    // #endregion

    // #region Secret validation
    const { secret, secretExpiresAt } = registration;
    if (!secret) {
      return this.createTransitionResult(registration.status, false, RegistrationTransitionMessage.NoSecretFound);
    }

    if (secretExpiresAt && secretExpiresAt < new Date()) {
      return this.createTransitionResult(registration.status, false, RegistrationTransitionMessage.SecretExpired);
    }

    const { code } = input;
    if (secret !== code) {
      return this.createTransitionResult(
        registration.status,
        false,
        RegistrationTransitionMessage.VerificationCodeMismatch
      );
    }
    // #endregion

    // #region User valdiation
    // As further we will need User entity to update anyway - we first do validations for that
    const user = await this.domainServices.userServices.getUserById(userId);
    if (!user) {
      return this.createTransitionResult(registration.status, false, RegistrationTransitionMessage.WrongInput);
    }
    // #endregion

    // #region Update registration, User and create Login

    // As we already validated that there are only two possible states (EmailVerifying, PhoneNumberVerifying) - we free to do simple ternary operator
    const newRegistrationStatus =
      existedRegistrationStatus === RegistrationStatus.EmailVerifying
        ? RegistrationStatus.EmailVerified
        : RegistrationStatus.PhoneNumberVerified;

    const loginType =
      newRegistrationStatus === RegistrationStatus.EmailVerified
        ? LoginType.OneTimeCodeEmail
        : LoginType.OneTimeCodePhoneNumber;

    // We should ONLY create a Login for the 1st contact verification (which is currently Email)
    // Login
    const newLogin = {
      loginType: loginType,
      userId: user.id,
      updatedAt: new Date(),
    };

    this.logger.debug(`About to update registration, user and add login during verifying contact for user ${user.id}`, {
      user,
      registration: { ...registration, secret: '***' },
      login: newLogin || 'null',
    });

    // Registration
    registration.status = newRegistrationStatus;
    registration.secret = null;
    registration.secretExpiresAt = null;

    // User
    user.registrationStatus = newRegistrationStatus;
    if (newRegistrationStatus === RegistrationStatus.EmailVerified) {
      user.email = user.pendingEmail;
      user.pendingEmail = null;
    } else {
      user.phoneNumber = user.pendingPhoneNumber;
      user.pendingPhoneNumber = null;
    }

    this.logger.debug(`Updated registration, user and add login data before apply`, {
      user,
      registration: { ...registration, secret: '***' },
      login: newLogin || 'null',
    });

    await this.domainServices.userServices.createUserLoginOnRegistration(user, registration, newLogin);

    // #endregion

    this.sendEvent(
      user,
      existedRegistrationStatus === RegistrationStatus.EmailVerifying
        ? VerificationEvent.EmailVerified
        : VerificationEvent.PhoneNumberVerified
    );

    // Checking the possibility to complete registration
    // This looks the same as loginType above? Am I missing something?
    const secondLoginType =
      newRegistrationStatus === RegistrationStatus.EmailVerified
        ? LoginType.OneTimeCodeEmail
        : LoginType.OneTimeCodePhoneNumber;

    const isSecondContactVerified = await this.isSecondContactVerified(userId, secondLoginType);
    if (isSecondContactVerified) {
      return this.createTransitionResult(RegistrationStatus.Registered, true, null);
    }

    return this.createTransitionResult(newRegistrationStatus, true, null, undefined, undefined);
  }

  private async isSecondContactVerified(userId: string, loginType: LoginType): Promise<boolean> {
    const login = await this.domainServices.userServices.getUserLoginByType(userId, loginType);
    return !!login;
  }
}
