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
      action: RegistrationInitiatedCommand<RegistrationType.Organic>,
    },
    {
      state: RegistrationStatus.EmailVerifying,
      nextState: RegistrationStatus.EmailVerified,
      successEvent: VerificationEvent.EmailVerified,
      failureEvent: null,
      action: VerifyEmailCommand<RegistrationType.Organic>,
    },
    {
      state: RegistrationStatus.EmailVerified,
      nextState: RegistrationStatus.PhoneNumberVerifying,
      successEvent: VerificationEvent.PhoneNumberVerifying,
      failureEvent: null,
      action: InitiatePhoneNumberVerificationCommand<RegistrationType.Organic>,
    },
    {
      state: RegistrationStatus.PhoneNumberVerifying,
      nextState: RegistrationStatus.PhoneNumberVerified,
      successEvent: VerificationEvent.PhoneNumberVerified,
      failureEvent: null,
      action: VerifyPhoneNumberCommand<RegistrationType.Organic>,
    },
    {
      state: RegistrationStatus.PhoneNumberVerified,
      nextState: RegistrationStatus.Registered,
      successEvent: VerificationEvent.Verified,
      failureEvent: null,
      action: VerificationCompleteCommand<RegistrationType.Organic>,
    },
  ];

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
