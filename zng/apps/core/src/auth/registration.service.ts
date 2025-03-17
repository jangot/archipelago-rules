import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { UserRegisterResponseDto } from '../dto/response/user-register-response.dto';
import { RegistrationDto, RegistrationTransitionResultDto } from '../dto';
import { AuthService } from './auth.service';
import { RegistrationExceptionFactory } from './registration/registration-exception.factory';
import { UserLoginPayloadDto } from '../dto/response/user-login-payload.dto';
import {
  InitiateEmailVerificationCommand,
  InitiatePhoneNumberVerificationCommand,
  RegistrationInitiatedCommand,
  VerificationCompleteCommand,
  VerifyContactCommand,
} from './registration/commands';
import { RegistrationStatus } from '@library/entity/enum';

@Injectable()
export class RegistrationService {
  private readonly logger: Logger = new Logger(RegistrationService.name);

  constructor(
    private readonly authService: AuthService,
    private readonly commandBus: CommandBus
  ) {}

  /**
   * Registers a new user.
   * @param input - The registration data transfer object.
   * @returns A promise that resolves to a UserRegisterResponseDto.
   */
  public async register(input: RegistrationDto): Promise<UserRegisterResponseDto> {
    this.logger.debug(`register: Registering user`, { input });

    const newResult = await this.commandBus.execute(new RegistrationInitiatedCommand({ id: null, input }));

    return this.handleRegistrationResult(newResult, input?.email ?? null);
  }

  /**
   * Verifies the registration of a user.
   * @param input - The registration data transfer object.
   * @returns A promise that resolves to a JwtResponseDto or null.
   */
  public async verifyRegistration(input: RegistrationDto): Promise<UserLoginPayloadDto | null> {
    const { userId } = input;
    if (!userId) {
      throw new HttpException('User ID is required for verification', HttpStatus.BAD_REQUEST);
    }

    this.logger.debug(`verifyRegistration: Verifying user: ${userId}`);

    // Do email / phone number verification by code
    const verificationResult = await this.commandBus.execute(new VerifyContactCommand({ id: userId, input }));
    return this.handleVerificationResult(verificationResult, userId);
  }

  public async updateRegistrationContact(
    input: RegistrationDto,
    authUserId?: string
  ): Promise<UserRegisterResponseDto | null> {
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
      const emailUpdateResult = await this.commandBus.execute(
        new InitiateEmailVerificationCommand({ id: userId, input })
      );
      return this.handleRegistrationResult(emailUpdateResult, userId);
    }
    if (phoneNumber) {
      const phoneUpdateResult = await this.commandBus.execute(
        new InitiatePhoneNumberVerificationCommand({ id: userId, input })
      );
      return this.handleRegistrationResult(phoneUpdateResult, userId);
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
    result: RegistrationTransitionResultDto | null,
    email: string | null,
    phoneNumber: string | null = null
  ): Promise<UserRegisterResponseDto> {
    if (!result) {
      this.logger.warn('handleRegistrationResult: Registration failed');
      // TODO: Should NOT return a 500 StatusCode here
      // Why would we log a warning here?
      // Did we throw an Exception previously and we caught it and Logged it?
      // Not sure what a Registration failure here means? What can the User do to resolve this issue?
      throw new HttpException('Registration failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    const { state, isSuccessful, userId, message, code } = result;

    if (!isSuccessful) {
      const exception = RegistrationExceptionFactory.translate(message, state);
      throw exception;
    } else {
      return {
        id: userId!,
        email: email ?? null,
        phoneNumber: phoneNumber ?? null,
        verificationState: state!,
        verificationCode: code!,
      };
    }
  }

  /**
   * Handles the result of a verification process.
   * @param result - The result of the registration transition.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to a JwtResponseDto or null.
   */
  private async handleVerificationResult(
    result: RegistrationTransitionResultDto | null,
    userId: string
  ): Promise<UserLoginPayloadDto | null> {
    if (!result) {
      this.logger.warn('handleVerificationResult: Registration Verification failed');
      throw new HttpException('Registration Verification failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const { state, isSuccessful, message } = result;

    if (!isSuccessful) {
      const exception = RegistrationExceptionFactory.translate(message, state);
      throw exception;
    } else {
      // It is possible that after contact verification registration might be called completed
      // If so - execute completion command
      if (result.state === RegistrationStatus.Registered) {
        await this.commandBus.execute(new VerificationCompleteCommand({ id: userId, input: { userId } }));
      }
      return await this.authService.loginById(userId, '1h');
    }
  }
}
