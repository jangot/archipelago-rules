import { Injectable, Logger } from '@nestjs/common';
import { RegistrationFlow } from './registration-flow.base';
import { OrganicRegistrationDto, RegistrationTransitionMessage, RegistrationTransitionResultDto } from '../../dto';
import { RegistrationStageTransition } from './stage-transition.interface';
import { ContactType, LoginStatus, LoginType, RegistrationStatus, RegistrationType } from '@library/entity/enum';
import { VerificationEvent } from '../verification';
import { generateSecureCode } from '@library/shared/common/helpers';
import { Transactional } from 'typeorm-transactional';
// // TODO: Move to config?
// const VERIFICATION_ATTEMPTS_LIMIT = 3;
// const VERIFICATION_LOCK_MINUTES = 5;
// const VERIFICATION_CODE_TTL_MINUTES = 2;

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
      action: this.initiateRegistration,
    },
    {
      state: RegistrationStatus.EmailVerifying,
      nextState: RegistrationStatus.EmailVerified,
      successEvent: VerificationEvent.EmailVerified,
      failureEvent: null,
      action: this.verifyEmail,
    },
    {
      state: RegistrationStatus.EmailVerified,
      nextState: RegistrationStatus.PhoneNumberVerifying,
      successEvent: VerificationEvent.PhoneNumberVerifying,
      failureEvent: null,
      action: () => Promise.resolve({} as RegistrationTransitionResultDto), // TODO: Implement
    },
    {
      state: RegistrationStatus.PhoneNumberVerifying,
      nextState: RegistrationStatus.PhoneNumberVerified,
      successEvent: VerificationEvent.PhoneNumberVerified,
      failureEvent: null,
      action: () => Promise.resolve({} as RegistrationTransitionResultDto), // TODO: Implement
    },
    {
      state: RegistrationStatus.PhoneNumberVerified,
      nextState: RegistrationStatus.Registered,
      successEvent: VerificationEvent.Verified,
      failureEvent: null,
      action: () => Promise.resolve({} as RegistrationTransitionResultDto), // TODO: Implement
    },
    {
      state: RegistrationStatus.Registered,
      nextState: null,
      successEvent: null,
      failureEvent: null,
      action: () => Promise.resolve({} as RegistrationTransitionResultDto), // TODO: Implement
    },
  ];

  private async initiateRegistration(
    id: string | null,
    input: OrganicRegistrationDto
  ): Promise<RegistrationTransitionResultDto> {
    const { firstName, lastName, email } = input;

    if (!email) {
      return {
        state: RegistrationStatus.NotRegistered,
        isSuccessful: false,
        message: RegistrationTransitionMessage.NoContactProvided,
      };
    }

    const userByEmail = await this.data.users.getUserByContact(email, ContactType.EMAIL);

    if (userByEmail) {
      return {
        state: RegistrationStatus.NotRegistered,
        isSuccessful: false,
        message: RegistrationTransitionMessage.ContactTaken,
      };
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

    return {
      state: RegistrationStatus.EmailVerifying,
      isSuccessful: true,
      message: null,
      userId,
      code: verificationCode,
    };
  }

  @Transactional()
  private async verifyEmail(id: string, input: OrganicRegistrationDto): Promise<RegistrationTransitionResultDto> {
    // Check that registration is exists and intention is correct
    const registration = await this.getUserRegistration(id);

    if (!registration || registration.status !== RegistrationStatus.EmailVerifying) {
      return {
        state: registration?.status ?? RegistrationStatus.NotRegistered,
        isSuccessful: false,
        message: RegistrationTransitionMessage.NoRegistrationStatusFound,
      };
    }

    const { secret, secretExpiresAt } = registration;
    if (!secret) {
      return {
        state: registration.status,
        isSuccessful: false,
        message: RegistrationTransitionMessage.NoSecretFound,
      };
    }

    if (secretExpiresAt && secretExpiresAt < new Date()) {
      return {
        state: registration.status,
        isSuccessful: false,
        message: RegistrationTransitionMessage.SecretExpired,
      };
    }

    const { code } = input;
    if (secret !== code) {
      return {
        state: registration.status,
        isSuccessful: false,
        message: RegistrationTransitionMessage.VerificationCodeMismatch,
      };
    }

    registration.status = RegistrationStatus.EmailVerified;
    registration.secret = null;
    registration.secretExpiresAt = null;

    const user = await this.data.users.getUserById(registration.userId);
    if (!user) {
      return {
        state: registration.status,
        isSuccessful: false,
        message: RegistrationTransitionMessage.WrongInput,
      };
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

    return { state: RegistrationStatus.EmailVerified, isSuccessful: true, message: null };
  }

  // // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // private async initiateRegistration(_id = undefined, input: OrganicRegistrationRequestDto): Promise<string> {
  //   // const { firstName, lastName } = input;
  //   // if (!firstName || !lastName) {
  //   //   // TODO: Add message about the reason of returning
  //   //   return '';
  //   // }
  //   // const registrationId = await this.createRegistrationState(
  //   //   input,
  //   //   { firstName, lastName },
  //   //   OrganicRegistrationStage.Initiated
  //   // );
  //   // // TODO: expiration from config
  //   // const secret = this.config.getOrThrow('JWT_REGISTRATION_SECRET');
  //   // const token = this.jwtService.sign({ id: registrationId }, { expiresIn: '1w', secret });
  //   // return token;
  // }

  // private async setEmail(id: string, input: OrganicRegistrationRequestDto): Promise<unknown> {
  //   // const { email } = input;
  //   // if (!email) {
  //   //   // TODO: Add message about the reason of returning
  //   //   return '';
  //   // }
  //   // // Check that registration is exists and intention is correct
  //   // const registration = await this.getRegistrationState(id);
  //   // if (!registration || registration.stage !== OrganicRegistrationStage.Initiated) {
  //   //   // TODO: Add message about the reason of returning
  //   //   return '';
  //   // }
  //   // // Check that email not taken yet
  //   // const existingUser = await this.usersService.getUserByContact(email, ContactType.EMAIL);
  //   // if (existingUser) {
  //   //   // TODO: Add message about the reason of returning
  //   //   return '';
  //   // }
  //   // // All checks are done here - time to update and move forward
  //   // registration.stage = OrganicRegistrationStage.EmailSet;
  //   // registration.data = this.stringifyPayload({ ...this.parsePayload(registration.data || '{}'), email });
  //   // const updateResult = await this.data.registrations.update(id, registration);
  //   // if (!updateResult) {
  //   //   // TODO: Add message about the reason of returning
  //   //   return '';
  //   // }
  //   // // Instead of finishing here - we should send email with verification code
  //   // await this.verifyEmail(id, input);
  // }

  // private async verifyEmail(id: string, input: OrganicRegistrationRequestDto): Promise<unknown> {
  //   // // Check that registration is exists and intention is correct
  //   // const registration = await this.getRegistrationState(id);
  //   // if (!registration || registration.stage !== OrganicRegistrationStage.EmailSet) {
  //   //   // TODO: Add message about the reason of returning
  //   //   return '';
  //   // }
  //   // // TODO: Checks below will be mostly the same for phone --> follow DRY principle
  //   // // Check that limits not reached
  //   // const { expiresAt, unlocksAt, retries } = registration;
  //   // // Expired verification code timespan
  //   // if (expiresAt && expiresAt < new Date()) {
  //   //   // TODO: Add message about the reason of returning
  //   //   return '';
  //   // }
  //   // // Registration is locked (too many attempts) - give a meaningfull message and do nothing then
  //   // if (unlocksAt && unlocksAt > new Date()) {
  //   //   // TODO: Add message about the reason of returning
  //   //   return '';
  //   // }
  //   // // Check already made retries count. If limit reached - lock registration
  //   // // TODO: doublecheck conditions order and logic
  //   // if (retries && retries >= VERIFICATION_ATTEMPTS_LIMIT) {
  //   //   registration.unlocksAt = new Date(Date.now() + VERIFICATION_LOCK_MINUTES * 60 * 1000);
  //   //   registration.retries = 0;
  //   //   await this.data.registrations.update(id, registration);
  //   //   // TODO: Add message about the reason of returning
  //   //   return '';
  //   // }
  //   // const code = generateSecureCode(6);
  //   // const hashedCode = await hash(code, 10);
  //   // const expiration = new Date(Date.now() + VERIFICATION_CODE_TTL_MINUTES * 60 * 1000);
  //   // registration.secret = hashedCode;
  //   // registration.expiresAt = expiration;
  //   // registration.retries = 0;
  //   // await this.data.registrations.update(id, registration);
  //   // // TODO: Send code here
  // }

  // private async setPhoneNumber(id: string, input: OrganicRegistrationRequestDto): Promise<unknown> {}
  // private async verifyPhoneNumber(id: string, input: OrganicRegistrationRequestDto): Promise<unknown> {}
  // private async completeVerification(id: string, input: OrganicRegistrationRequestDto): Promise<unknown> {}
}
