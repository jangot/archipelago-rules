import { Injectable, Logger } from '@nestjs/common';
import { RegistrationFlow } from './registration-flow.base';
import { OrganicRegistrationDto, RegistrationTransitionMessage, RegistrationTransitionResultDto } from '../../dto';
import { RegistrationStageTransition } from './stage-transition.interface';
import { ContactType, LoginStatus, LoginType, RegistrationStatus, RegistrationType } from '@library/entity/enum';
import { VerificationEvent } from '../verification';
import { generateSecureCode } from '@library/shared/common/helpers';
import { Transactional } from 'typeorm-transactional';
import { transformPhoneNumber } from '@library/shared/common/data/transformers/phone-number.transformer';
import {
  InitiatePhoneNumberVerificationCommand,
  RegistrationInitiatedCommand,
  VerificationCompleteCommand,
  VerifyEmailCommand,
  VerifyPhoneNumberCommand,
} from './commands/registration.commands';

@Injectable()
export class OrganicRegistrationFlow extends RegistrationFlow<RegistrationType.Organic, OrganicRegistrationDto> {
  private readonly logger: Logger = new Logger(OrganicRegistrationFlow.name);
  protected supportedRegistrationLogins = [LoginType.OneTimeCodeEmail, LoginType.OneTimeCodePhoneNumber];

  protected stageTransitions: RegistrationStageTransition[] = [
    {
      state: RegistrationStatus.NotRegistered,
      nextState: RegistrationStatus.EmailVerifying,
      successEvent: VerificationEvent.EmailVerifying,
      failureEvent: null,
      action: RegistrationInitiatedCommand,
    },
    {
      state: RegistrationStatus.EmailVerifying,
      nextState: RegistrationStatus.EmailVerified,
      successEvent: VerificationEvent.EmailVerified,
      failureEvent: null,
      action: VerifyEmailCommand,
    },
    {
      state: RegistrationStatus.EmailVerified,
      nextState: RegistrationStatus.PhoneNumberVerifying,
      successEvent: VerificationEvent.PhoneNumberVerifying,
      failureEvent: null,
      action: InitiatePhoneNumberVerificationCommand,
    },
    {
      state: RegistrationStatus.PhoneNumberVerifying,
      nextState: RegistrationStatus.PhoneNumberVerified,
      successEvent: VerificationEvent.PhoneNumberVerified,
      failureEvent: null,
      action: VerifyPhoneNumberCommand,
    },
    {
      state: RegistrationStatus.PhoneNumberVerified,
      nextState: RegistrationStatus.Registered,
      successEvent: VerificationEvent.Verified,
      failureEvent: null,
      action: VerificationCompleteCommand,
    },
  ];

  private async initiateRegistration(
    id: string | null,
    input: OrganicRegistrationDto
  ): Promise<RegistrationTransitionResultDto> {
    const { firstName, lastName, email } = input;

    if (!email) {
      return this.createTransitionResult(
        RegistrationStatus.NotRegistered,
        false,
        RegistrationTransitionMessage.NoContactProvided
      );
    }

    const userByEmail = await this.data.users.getUserByContact(email, ContactType.EMAIL);

    if (userByEmail) {
      return this.createTransitionResult(
        RegistrationStatus.NotRegistered,
        false,
        RegistrationTransitionMessage.ContactTaken
      );
    }

    const verificationCode = generateSecureCode(6); // Generate new Verification code
    const verificationCodeExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour expiration for now

    const newUser = {
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      pendingEmail: email,
      registrationStatus: RegistrationStatus.EmailVerifying,
    };

    // Create the barebones User here
    const user = await this.data.users.create(newUser);
    const { id: userId } = user;
    const newUserRegistration = {
      userId,
      status: RegistrationStatus.EmailVerifying,
      secret: verificationCode,
      secretExpiresAt: verificationCodeExpiresAt,
    };
    // Create User Registration and store verification code with expiration date
    const userRegistration = await this.data.userRegistrations.create(newUserRegistration);
    this.logger.debug(`initiateRegistration: Registering user: ${email}`, {
      user,
      userRegistration: { ...userRegistration, secret: null },
    });

    return this.createTransitionResult(RegistrationStatus.EmailVerifying, true, null, userId, verificationCode);
  }

  @Transactional()
  private async verifyEmail(id: string, input: OrganicRegistrationDto): Promise<RegistrationTransitionResultDto> {
    const registration = await this.getUserRegistration(id);

    if (!registration || registration.status !== RegistrationStatus.EmailVerifying) {
      return this.createTransitionResult(
        registration?.status ?? RegistrationStatus.NotRegistered,
        false,
        RegistrationTransitionMessage.NoRegistrationStatusFound
      );
    }

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

    registration.status = RegistrationStatus.EmailVerified;
    registration.secret = null;
    registration.secretExpiresAt = null;

    const user = await this.data.users.getUserById(registration.userId);
    if (!user) {
      return this.createTransitionResult(registration.status, false, RegistrationTransitionMessage.WrongInput);
    }
    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.registrationStatus = RegistrationStatus.EmailVerified;

    const emailLogin = {
      type: LoginType.OneTimeCodeEmail,
      contact: user.email,
      userId: user.id,
      loginStatus: LoginStatus.NotLoggedIn,
    };

    await Promise.all([
      this.data.userRegistrations.update(id, registration),
      this.data.users.update(user.id, user),
      this.data.logins.create(emailLogin),
    ]);

    return this.createTransitionResult(RegistrationStatus.EmailVerified, true, null);
  }

  @Transactional()
  private async initiatePhoneNumberVerification(
    id: string,
    input: OrganicRegistrationDto
  ): Promise<RegistrationTransitionResultDto> {
    const registration = await this.getUserRegistration(id);

    if (!registration || registration.status !== RegistrationStatus.EmailVerified) {
      return this.createTransitionResult(
        registration?.status ?? RegistrationStatus.NotRegistered,
        false,
        RegistrationTransitionMessage.NoRegistrationStatusFound
      );
    }

    const { phoneNumber } = input;

    if (!phoneNumber) {
      return this.createTransitionResult(
        RegistrationStatus.EmailVerified,
        false,
        RegistrationTransitionMessage.NoContactProvided
      );
    }

    const userByPhone = await this.data.users.getUserByContact(phoneNumber, ContactType.PHONE_NUMBER);

    if (userByPhone) {
      return this.createTransitionResult(
        RegistrationStatus.NotRegistered,
        false,
        RegistrationTransitionMessage.ContactTaken
      );
    }

    const user = await this.data.users.getUserById(registration.userId);
    if (!user) {
      return this.createTransitionResult(
        RegistrationStatus.EmailVerified,
        false,
        RegistrationTransitionMessage.WrongInput
      );
    }

    const verificationCode = generateSecureCode(6); // Generate new Verification code
    const verificationCodeExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour expiration for now

    registration.secret = verificationCode;
    registration.secretExpiresAt = verificationCodeExpiresAt;
    registration.status = RegistrationStatus.PhoneNumberVerifying;

    user.pendingPhoneNumber = transformPhoneNumber(phoneNumber);
    user.registrationStatus = RegistrationStatus.PhoneNumberVerifying;

    await Promise.all([this.data.userRegistrations.update(id, registration), this.data.users.update(user.id, user)]);

    return this.createTransitionResult(RegistrationStatus.PhoneNumberVerifying, true, null);
  }

  @Transactional()
  private async verifyPhoneNumber(id: string, input: OrganicRegistrationDto): Promise<RegistrationTransitionResultDto> {
    const registration = await this.getUserRegistration(id);

    if (!registration || registration.status !== RegistrationStatus.PhoneNumberVerifying) {
      return this.createTransitionResult(
        registration?.status ?? RegistrationStatus.NotRegistered,
        false,
        RegistrationTransitionMessage.NoRegistrationStatusFound
      );
    }

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

    registration.status = RegistrationStatus.PhoneNumberVerified;
    registration.secret = null;
    registration.secretExpiresAt = null;

    const user = await this.data.users.getUserById(registration.userId);
    if (!user) {
      return this.createTransitionResult(registration.status, false, RegistrationTransitionMessage.WrongInput);
    }
    user.phoneNumber = user.pendingPhoneNumber;
    user.pendingPhoneNumber = null;
    user.registrationStatus = RegistrationStatus.PhoneNumberVerified;

    const phoneLogin = {
      type: LoginType.OneTimeCodePhoneNumber,
      contact: user.phoneNumber,
      userId: user.id,
      loginStatus: LoginStatus.NotLoggedIn,
    };

    await Promise.all([
      this.data.userRegistrations.update(id, registration),
      this.data.users.update(user.id, user),
      this.data.logins.create(phoneLogin),
    ]);

    return this.completeVerification(id);
  }

  @Transactional()
  private async completeVerification(id: string): Promise<RegistrationTransitionResultDto> {
    const user = await this.data.users.getUserById(id);
    const registration = await this.getUserRegistration(id);

    if (!user || !registration) {
      return this.createTransitionResult(
        RegistrationStatus.PhoneNumberVerified,
        false,
        RegistrationTransitionMessage.WrongInput
      );
    }

    const { registrationStatus } = user;
    const { status } = registration;

    if (
      registrationStatus !== RegistrationStatus.PhoneNumberVerified ||
      status !== RegistrationStatus.PhoneNumberVerified
    ) {
      return this.createTransitionResult(
        RegistrationStatus.PhoneNumberVerified,
        false,
        RegistrationTransitionMessage.VerificationCouldNotBeCompleted
      );
    }

    user.registrationStatus = RegistrationStatus.Registered;
    registration.status = RegistrationStatus.Registered;

    await Promise.all([this.data.users.update(user.id, user), this.data.userRegistrations.update(id, registration)]);

    return this.createTransitionResult(RegistrationStatus.Registered, true, null);
  }

  /**
   * Creates a registration transition result.
   * @param state - The current registration status.
   * @param isSuccessful - Whether the transition was successful.
   * @param message - The transition message.
   * @param userId - The user ID.
   * @param code - The verification code.
   * @returns A RegistrationTransitionResultDto.
   */
  private createTransitionResult(
    state: RegistrationStatus,
    isSuccessful: boolean,
    message: RegistrationTransitionMessage | null,
    userId?: string,
    code?: string
  ): RegistrationTransitionResultDto {
    return {
      state,
      isSuccessful,
      message,
      userId,
      code,
    };
  }
}
