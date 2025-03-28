import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegistrationBaseCommandHandler } from './registration.base.command-handler';
import { VerifyContactCommand } from './registration.commands';
import { RegistrationStatus } from '@library/entity/enum';
import { VerificationEvent } from '../../verification';
import { RegistrationTransitionResult } from '@library/shared/types';
import { logSafeRegistration, logSafeUser } from '@library/shared/common/helpers';
import { RegistrationLogic } from '../registration.logic';
import { EntityNotFoundException, MissingInputException, RegistrationSecretExpiredException, RegistrationSecretNotFoundException, RegistrationSessionNotInitiatedException, RegistrationSessionNotWaingForVerificationException, UnableToCreateLoginOnRegistrationException, VerificationCodeMismatchException } from '@library/shared/common/exceptions/domain';
import { ILogin } from '@library/entity/interface';
@CommandHandler(VerifyContactCommand)
export class VerifyContactCommandHandler
  extends RegistrationBaseCommandHandler<VerifyContactCommand>
  implements ICommandHandler<VerifyContactCommand> {
  public async execute(command: VerifyContactCommand): Promise<RegistrationTransitionResult> {
    if (!command || !command.payload || !command.payload.input) {
      this.logger.warn('VerifyContact: Invalid command payload', { command });
      throw new MissingInputException('Invalid command payload');
    }
    const { payload: { id: userId, input } } = command;
    // #region Input validation
    if (!userId) {
      throw new MissingInputException('User id cannot be null when verifying contact.');
    }
    // #endregion

    // #region Registration state validation
    const registration = await this.domainServices.userServices.getUserRegistration(userId);
    if (!registration) {
      this.logger.debug(`No registration found for user ${userId}`);
      throw new RegistrationSessionNotInitiatedException(`No registration found for user ${userId}`);
    }
    const { status: existedRegistrationStatus } = registration;
    if (!RegistrationLogic.isPendingRegistrationState(registration.status)) {
      this.logger.debug(`User ${userId} is not awaiting for code verification`);
      throw new RegistrationSessionNotWaingForVerificationException(`User ${userId} is not waiting for code verification`);
    }
    // #endregion

    // #region Secret validation
    const { secret, secretExpiresAt } = registration;
    if (!secret) {
      this.logger.debug(`No secret found for user ${userId}`);
      throw new RegistrationSecretNotFoundException(`No secret found for user ${userId}`);
    }

    if (secretExpiresAt && secretExpiresAt < new Date()) {
      this.logger.debug(`Secret expired for user ${userId}`);
      throw new RegistrationSecretExpiredException(`Secret expired for user ${userId}`);
    }

    const { code } = input;
    if (secret !== code) {
      this.logger.debug(`Verification code mismatch for user ${userId}`);
      throw new VerificationCodeMismatchException(`Verification code mismatch for user ${userId}`);
    }
    // #endregion

    // #region User valdiation
    // As further we will need User entity to update anyway - we first do validations for that
    const user = await this.domainServices.userServices.getUserById(userId);
    if (!user) {
      this.logger.debug(`No user found by ${userId}`);
      throw new EntityNotFoundException(`No user found by ${userId}`);
    }
    // #endregion

    // #region Update registration, User and create Login

    // As we already validated that there are only two possible states (EmailVerifying, PhoneNumberVerifying) - we free to do simple ternary operator
    const newRegistrationStatus = RegistrationLogic.calculateNewRegistrationStatus(existedRegistrationStatus);
    const loginType = RegistrationLogic.getLoginTypeForRegistrationStatus(newRegistrationStatus);
    const shouldCreateLogin = RegistrationLogic.shouldCreateUserLogin(newRegistrationStatus);
    // We should ONLY create a Login for the 1st contact verification (which is currently Email)
    // Login
    const newLogin = shouldCreateLogin ? { loginType: loginType, userId: user.id, updatedAt: new Date() } : null;

    this.logger.debug(`About to update registration, user and add login during verifying contact for user ${user.id}`, {
      user: logSafeUser(user),
      registration: logSafeRegistration(registration),
      login: newLogin,
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
      user.onboardStatus = RegistrationStatus.EmailVerified;
    } else {
      user.phoneNumber = user.pendingPhoneNumber;
      user.pendingPhoneNumber = null;
      user.onboardStatus = RegistrationStatus.PhoneNumberVerified;
    }

    user.verificationStatus = RegistrationLogic.calculateNewVerificationStatus(user.verificationStatus);

    this.logger.debug('Updated registration, user and add login data before apply', {
      user: logSafeUser(user),
      registration: logSafeRegistration(registration),
      login: newLogin,
    });

    let userLogin: ILogin | null = null;

    if (shouldCreateLogin) {
      userLogin = await this.domainServices.userServices.createUserLoginOnRegistration(user, registration, newLogin);
      if (!userLogin) {
        this.logger.error(`Failed to create login for user ${user.id}`);
        throw new UnableToCreateLoginOnRegistrationException(`Failed to create login for user ${user.id}`);
      }    
    } else {
      this.logger.debug('Updating User and Registration as contact was verified');
      await this.domainServices.userServices.updateUserRegistration(registration, user);
    }
    // #endregion

    this.sendEvent(
      user,
      existedRegistrationStatus === RegistrationStatus.EmailVerifying ? VerificationEvent.EmailVerified : VerificationEvent.PhoneNumberVerified
    );

    return this.createTransitionResult(newRegistrationStatus, true, user.id, userLogin?.id);
  }
}
