import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { UserRegisterResponseDto } from '@core/modules/auth/dto/response/user-register-response.dto';
import { RegistrationDto } from '@core/modules/auth/dto/request/registration.request.dto';
import { UserLoginPayloadDto } from '@core/modules/auth/dto/response/user-login-payload.dto';
import {
  InitiateEmailVerificationCommand,
  InitiatePhoneNumberVerificationCommand,
  RegistrationInitiatedCommand,
  VerificationCompleteCommand,
  VerifyContactCommand,
} from './registration/commands';
import { ContactType, RegistrationStatus } from '@library/entity/enum';
import { RegistrationTransitionResult } from './registration/registration-transition-result';
import { LoginOnContactVerifiedCommand } from './login/commands';
import { ApiStatusResponseDto } from '@library/shared/common/dto/response/api.status.dto';
import { RegistrationProcessingFailedException } from './exceptions/auth-domain.exceptions';

const COMPLETE_VERIFICATION_ON_STATUS = RegistrationStatus.PhoneNumberVerified;
@Injectable()
export class RegistrationService {
  private readonly logger: Logger = new Logger(RegistrationService.name);

  constructor(private readonly commandBus: CommandBus) {}

  /**
   * Registers a new user.
   * @param input - The registration data transfer object.
   * @returns A promise that resolves to a UserRegisterResponseDto.
   */
  public async register(input: RegistrationDto): Promise<UserRegisterResponseDto> {
    this.logger.debug('register: Registering user', { input });

    const newResult = await this.commandBus.execute(new RegistrationInitiatedCommand({ id: null, input }));

    return this.handleRegistrationResult(newResult, input?.email ?? null);
  }

  /**
   * Verifies the registration of a user.
   * @param input - The registration data transfer object.
   * @returns A promise that resolves to a JwtResponseDto or null.
   */
  public async verifyRegistration(input: RegistrationDto): Promise<UserLoginPayloadDto | ApiStatusResponseDto | null> {
    const { userId } = input;
    if (!userId) {
      throw new HttpException('User ID is required for verification', HttpStatus.BAD_REQUEST);
    }

    this.logger.debug(`verifyRegistration: Verifying user: ${userId}`);

    // Do email / phone number verification by code
    const verificationResult = await this.commandBus.execute(new VerifyContactCommand({ id: userId, input }));
    return this.handleVerificationResult(verificationResult, userId);
  }

  public async updateRegistrationContact(input: RegistrationDto, authUserId?: string): Promise<UserRegisterResponseDto | null> {
    const { userId, email, phoneNumber } = input;
    if (!userId) {
      throw new HttpException('User ID is required for verification', HttpStatus.BAD_REQUEST);
    }
    if (!email && !phoneNumber) {
      throw new HttpException('Email or Phone Number is required for verification', HttpStatus.BAD_REQUEST);
    }
    // Validate that the User Id of the Authenticated User matches the User Id in the body payload (if this is an Authenticated request)
    if (!authUserId || authUserId !== userId) {
      throw new HttpException('User Id does not match authenticated user.', HttpStatus.BAD_REQUEST);
    }
    // Give email a priority in flow:
    // - if email provided - update email and start email verification
    // - if email not provided but phone number - update phone number and start phone number verification
    if (email) {
      const emailUpdateResult = await this.commandBus.execute(new InitiateEmailVerificationCommand({ id: userId, input }));
      return this.handleRegistrationResult(emailUpdateResult, email);
    }
    if (phoneNumber) {
      const phoneUpdateResult = await this.commandBus.execute(new InitiatePhoneNumberVerificationCommand({ id: userId, input }));
      return this.handleRegistrationResult(phoneUpdateResult, null, phoneNumber);
    }
    return null;
  }

  /**
   * Handles the result of a registration process.
   * @param result - The result of the registration transition.
   * @param email - The email of the user.
   * @param phoneNumber - The phone number of the user.
   * @returns A promise that resolves to a UserRegisterResponseDto.
   */
  private async handleRegistrationResult(
    result: RegistrationTransitionResult | null,
    email: string | null,
    phoneNumber: string | null = null
  ): Promise<UserRegisterResponseDto> {
    if (!result || !result.isSuccessful) {
      // This section is expected to be unreachable as any registration failure should be handled by the command handler
      // But for the case when handling missed - we take care about this here
      this.logger.warn('handleRegistrationResult: Registration failed', { result, email, phoneNumber });
      throw new RegistrationProcessingFailedException('Registration failed');
    }
    const { state, userId, code } = result;

    return { id: userId!, email: email ?? null, phoneNumber: phoneNumber ?? null, verificationState: state!, verificationCode: code! };
    
  }

  /**
   * Handles the result of a verification process.
   * @param result - The result of the registration transition.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to a JwtResponseDto or null.
   */
  private async handleVerificationResult(result: RegistrationTransitionResult | null, userId: string)
  : Promise<UserLoginPayloadDto | ApiStatusResponseDto | null> {
    if (!result || !result.isSuccessful) {
      // This section is expected to be unreachable as any registration verification failure should be handled by the command handler
      // But for the case when handling missed - we take care about this here
      this.logger.warn('handleVerificationResult: Registration Verification failed', { result });
      throw new RegistrationProcessingFailedException('Registration Verification failed');
    }

    const { state, loginId: resultLoginId } = result;


    // It is possible that after contact verification registration might be called completed
    // If so - execute completion command
    if (state === COMPLETE_VERIFICATION_ON_STATUS) {
      await this.commandBus.execute(new VerificationCompleteCommand({ id: userId, input: { userId } }));      
    }
    const contactType = state === RegistrationStatus.EmailVerified ? ContactType.EMAIL : ContactType.PHONE_NUMBER;
    const loginId = state === COMPLETE_VERIFICATION_ON_STATUS ? undefined : resultLoginId;

    // We cannot pass in the loginId if the registration is complete. This will cause us to regenerate and save a new JWT token, and 
    // we will save it in the database.
    return loginId ? this.commandBus.execute(new LoginOnContactVerifiedCommand({ userId, contactType, loginId })) : new ApiStatusResponseDto('Success', 'Registration completed');
    
  }
}
