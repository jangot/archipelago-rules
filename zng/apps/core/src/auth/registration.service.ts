import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { IDataService } from '../data/idata.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { UserRegisterResponseDto } from '../dto/response/user-register-response.dto';
import { RegistrationStatus } from '@library/entity/enum/registration.status';
import { JwtResponseDto, RegistrationDto, RegistrationTransitionResultDto } from '../dto';
import { AuthService } from './auth.service';
import { RegistrationFactory } from './registration.factory';
import { RegistrationExceptionFactory } from './registration/registration-exception.factory';

@Injectable()
export class RegistrationService {
  private readonly logger: Logger = new Logger(RegistrationService.name);

  constructor(
    private readonly dataService: IDataService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly authService: AuthService,
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus
  ) {}

  /**
   * Registers a new user.
   * @param input - The registration data transfer object.
   * @returns A promise that resolves to a UserRegisterResponseDto.
   */
  public async register(input: RegistrationDto): Promise<UserRegisterResponseDto> {
    this.logger.debug(`register: Registering user`, { input });

    const result = await this.advanceRegistrationFlow(input, RegistrationStatus.NotRegistered);
    return this.handleRegistrationResult(result, input?.email ?? null);
  }

  /**
   * Verifies the registration of a user.
   * @param input - The registration data transfer object.
   * @returns A promise that resolves to a JwtResponseDto or null.
   */
  public async verifyRegistration(input: RegistrationDto): Promise<JwtResponseDto | null> {
    const { userId } = input;
    if (!userId) {
      throw new HttpException('User ID is required for verification', HttpStatus.BAD_REQUEST);
    }
    this.logger.debug(`verifyRegistration: Verifying user: ${userId}`);

    const result = await this.advanceRegistrationFlow(input, RegistrationStatus.EmailVerifying);
    return this.handleVerificationResult(result, userId);
  }

  /**
   * Advances the registration process for a user.
   * @param input - The registration data transfer object.
   * @returns A promise that resolves to a UserRegisterResponseDto.
   */
  public async advanceRegistration(input: RegistrationDto): Promise<UserRegisterResponseDto> {
    this.logger.debug(`advanceRegistration: Advancing registration`, { input });

    const result = await this.advanceRegistrationFlow(input, RegistrationStatus.EmailVerified);
    return this.handleRegistrationResult(result, null, input.phoneNumber);
  }

  /**
   * Verifies the advanced registration of a user.
   * @param input - The registration data transfer object.
   * @returns A promise that resolves to a JwtResponseDto or null.
   */
  public async verifyAdvanceRegistration(input: RegistrationDto): Promise<JwtResponseDto | null> {
    const { userId } = input;
    if (!userId) {
      throw new HttpException('User ID is required for verification', HttpStatus.BAD_REQUEST);
    }
    this.logger.debug(`verifyAdvanceRegistration: Verifying user: ${userId}`);

    const result = await this.advanceRegistrationFlow(input, RegistrationStatus.PhoneNumberVerifying);
    return this.handleVerificationResult(result, userId);
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
  ): Promise<JwtResponseDto | null> {
    if (!result) {
      this.logger.warn('handleVerificationResult: Registration Verification failed');
      throw new HttpException('Registration Verification failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const { state, isSuccessful, message } = result;

    if (!isSuccessful) {
      const exception = RegistrationExceptionFactory.translate(message, state);
      throw exception;
    } else {
      // TODO: might require split to different JWTs based on a step
      return await this.authService.login(userId, '1h');
    }
  }

  /**
   * Advances the registration flow based on the input and starting status.
   * @param input - The registration data transfer object.
   * @param startFrom - The starting registration status.
   * @returns A promise that resolves to a RegistrationTransitionResultDto or null.
   */
  private async advanceRegistrationFlow(
    input: RegistrationDto,
    startFrom?: RegistrationStatus
  ): Promise<RegistrationTransitionResultDto | null> {
    const registrationFlow = RegistrationFactory.create(
      input.type,
      this.dataService,
      this.jwtService,
      this.config,
      this.eventBus,
      this.commandBus
    );
    return registrationFlow.advance(input, startFrom);
  }
}
