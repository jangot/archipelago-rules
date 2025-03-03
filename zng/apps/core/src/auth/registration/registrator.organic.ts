import { Injectable } from '@nestjs/common';
import { RegistratorBase } from './registrator.base';
import { OrganicRegistrationRequestDto } from '../../dto';
import { OrganicRegistrationData } from '@library/entity/interface';
import { RegistrationStageTransition } from './stage-transition.interface';
import { ContactType, OrganicRegistrationStage } from '@library/entity/enum';
import { generateSecureCode } from '@library/shared/common/helpers';
import { hash } from 'bcryptjs';

// TODO: Move to config?
const VERIFICATION_ATTEMPTS_LIMIT = 3;
const VERIFICATION_LOCK_MINUTES = 5;
const VERIFICATION_CODE_TTL_MINUTES = 2;

@Injectable()
export class OrganicRegistrator extends RegistratorBase<OrganicRegistrationData, OrganicRegistrationRequestDto> {
  protected stageTransitions: RegistrationStageTransition[] = [
    { from: undefined, to: OrganicRegistrationStage.Initiated, action: this.initiateRegistration },
    { from: OrganicRegistrationStage.Initiated, to: OrganicRegistrationStage.EmailSet, action: this.setEmail },
    {
      from: OrganicRegistrationStage.EmailSet,
      to: OrganicRegistrationStage.EmailVerificationSent,
      action: this.verifyEmail,
    },
    {
      from: OrganicRegistrationStage.EmailVerificationSent,
      to: OrganicRegistrationStage.PhoneNumberSet,
      action: this.setPhoneNumber,
    },
    {
      from: OrganicRegistrationStage.PhoneNumberSet,
      to: OrganicRegistrationStage.PhoneNumberVerificationSent,
      action: this.verifyPhoneNumber,
    },
    {
      from: OrganicRegistrationStage.PhoneNumberVerificationSent,
      to: OrganicRegistrationStage.Verified,
      action: this.completeVerification,
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async initiateRegistration(_id = undefined, input: OrganicRegistrationRequestDto): Promise<string> {
    const { firstName, lastName } = input;
    if (!firstName || !lastName) {
      // TODO: Add message about the reason of returning
      return '';
    }

    const registrationId = await this.createRegistrationState(
      input,
      { firstName, lastName },
      OrganicRegistrationStage.Initiated
    );

    // TODO: expiration from config
    const secret = this.config.getOrThrow('JWT_REGISTRATION_SECRET');
    const token = this.jwtService.sign({ id: registrationId }, { expiresIn: '1w', secret });
    return token;
  }

  private async setEmail(id: string, input: OrganicRegistrationRequestDto): Promise<unknown> {
    const { email } = input;
    if (!email) {
      // TODO: Add message about the reason of returning
      return '';
    }

    // Check that registration is exists and intention is correct
    const registration = await this.getRegistrationState(id);
    if (!registration || registration.stage !== OrganicRegistrationStage.Initiated) {
      // TODO: Add message about the reason of returning
      return '';
    }

    // Check that email not taken yet
    const existingUser = await this.usersService.getUserByContact(email, ContactType.EMAIL);
    if (existingUser) {
      // TODO: Add message about the reason of returning
      return '';
    }

    // All checks are done here - time to update and move forward
    registration.stage = OrganicRegistrationStage.EmailSet;
    registration.data = this.stringifyPayload({ ...this.parsePayload(registration.data || '{}'), email });

    const updateResult = await this.data.registrations.update(id, registration);

    if (!updateResult) {
      // TODO: Add message about the reason of returning
      return '';
    }

    // Instead of finishing here - we should send email with verification code
    await this.verifyEmail(id, input);
  }

  private async verifyEmail(id: string, input: OrganicRegistrationRequestDto): Promise<unknown> {
    // Check that registration is exists and intention is correct
    const registration = await this.getRegistrationState(id);
    if (!registration || registration.stage !== OrganicRegistrationStage.EmailSet) {
      // TODO: Add message about the reason of returning
      return '';
    }

    // TODO: Checks below will be mostly the same for phone --> follow DRY principle

    // Check that limits not reached
    const { expiresAt, unlocksAt, retries } = registration;

    // Expired verification code timespan
    if (expiresAt && expiresAt < new Date()) {
      // TODO: Add message about the reason of returning
      return '';
    }

    // Registration is locked (too many attempts) - give a meaningfull message and do nothing then
    if (unlocksAt && unlocksAt > new Date()) {
      // TODO: Add message about the reason of returning
      return '';
    }

    // Check already made retries count. If limit reached - lock registration
    // TODO: doublecheck conditions order and logic
    if (retries && retries >= VERIFICATION_ATTEMPTS_LIMIT) {
      registration.unlocksAt = new Date(Date.now() + VERIFICATION_LOCK_MINUTES * 60 * 1000);
      registration.retries = 0;
      await this.data.registrations.update(id, registration);
      // TODO: Add message about the reason of returning
      return '';
    }

    const code = generateSecureCode(6);
    const hashedCode = await hash(code, 10);
    const expiration = new Date(Date.now() + VERIFICATION_CODE_TTL_MINUTES * 60 * 1000);
    registration.secret = hashedCode;
    registration.expiresAt = expiration;
    registration.retries = 0;

    await this.data.registrations.update(id, registration);
    // TODO: Send code here
  }

  private async setPhoneNumber(id: string, input: OrganicRegistrationRequestDto): Promise<unknown> {}
  private async verifyPhoneNumber(id: string, input: OrganicRegistrationRequestDto): Promise<unknown> {}
  private async completeVerification(id: string, input: OrganicRegistrationRequestDto): Promise<unknown> {}
}
