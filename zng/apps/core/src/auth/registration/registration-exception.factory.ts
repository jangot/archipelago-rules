import { RegistrationStatus } from '@library/entity/enum';
import { RegistrationTransitionMessage } from '@library/shared/types';
import { HttpException, HttpStatus } from '@nestjs/common';

export class RegistrationExceptionFactory {
  public static translate(
    message: RegistrationTransitionMessage | null,
    state: RegistrationStatus | null
  ): HttpException {
    if (!message) {
      return new HttpException('Error during registration process', HttpStatus.BAD_REQUEST);
    }

    switch (message) {
      case RegistrationTransitionMessage.WrongInput:
        if (!state)
          return new HttpException('Got unexpected input during registration process', HttpStatus.BAD_REQUEST);
        return new HttpException(
          `Got unexpected input during registration process on step ${state}`,
          HttpStatus.BAD_REQUEST
        );
      case RegistrationTransitionMessage.NoTransitionFound:
        return new HttpException(`No transition found from step ${state}`, HttpStatus.BAD_REQUEST);
      case RegistrationTransitionMessage.NoNextState:
        return new HttpException(`No next step found from step ${state}`, HttpStatus.BAD_REQUEST);
      case RegistrationTransitionMessage.NoRegistrationStatusFound:
        return new HttpException('Unable to find User Registration for provided data', HttpStatus.BAD_REQUEST);
      case RegistrationTransitionMessage.NoContactProvided:
        if (state && state === RegistrationStatus.NotRegistered)
          return new HttpException('Email must be provided', HttpStatus.BAD_REQUEST);
        return new HttpException('Either email or phone number must be provided', HttpStatus.BAD_REQUEST);
      case RegistrationTransitionMessage.ContactTaken:
        return new HttpException('Provided email or phone number is already taken', HttpStatus.BAD_REQUEST);
      case RegistrationTransitionMessage.NoSecretFound:
        if (state && state === RegistrationStatus.EmailVerifying)
          return new HttpException('Nothing to compare verification code with', HttpStatus.BAD_REQUEST);
        return new HttpException('No secret found to compare verification code with', HttpStatus.BAD_REQUEST);
      case RegistrationTransitionMessage.SecretExpired:
        return new HttpException('Verification code has expired', HttpStatus.BAD_REQUEST);
      case RegistrationTransitionMessage.VerificationCodeMismatch:
        return new HttpException('Verification code does not match', HttpStatus.BAD_REQUEST);
      case RegistrationTransitionMessage.VerificationCouldNotBeCompleted:
        return new HttpException('Verification could not be completed yet', HttpStatus.BAD_REQUEST);
      case RegistrationTransitionMessage.CouldNotCreateUser:
        return new HttpException('Could not create user', HttpStatus.INTERNAL_SERVER_ERROR);
      case RegistrationTransitionMessage.NotAwaitingForCode:
        return new HttpException('User is not awaiting for verification code', HttpStatus.BAD_REQUEST);
      default:
        return new HttpException('Unknown error during registration process', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
