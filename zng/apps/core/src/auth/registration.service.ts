import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { IVerificationFlow } from './verification/iverification-flow.base';
import { IDataService } from '../data/idata.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';
import { UserRegisterResponseDto } from '../dto/response/user-register-response.dto';
import { generateSecureCode } from '@library/shared/common/helpers';
import { RegistrationStatus } from '@library/entity/enum/registration.status';
import { JwtResponseDto, RegistrationDto, RegistrationTransitionResultDto } from '../dto';
import { AuthService } from './auth.service';
import { ApplicationUser } from '../data/entity';
import { VerificationFlowState } from './verification/verification-flow.state';
import { VerificationFlowFactory } from './verification/verification-flow.factory';
import { IApplicationUser } from '@library/entity/interface';
import { RegistrationFactory } from './registration.factory';
import { RegistrationExceptionFactory } from './registration/registration-exception.factory';

@Injectable()
export class RegistrationService {
  private readonly logger: Logger = new Logger(RegistrationService.name);
  private verificationFlow: IVerificationFlow | null = null;

  constructor(
    private readonly dataService: IDataService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly authService: AuthService,
    private readonly eventBus: EventBus
  ) {}

  public async register(input: RegistrationDto): Promise<UserRegisterResponseDto> {
    this.logger.debug(`register: Registering user`, { input });

    const result = await this.advanceRegistrationFlow(input, RegistrationStatus.NotRegistered);
    if (!result) {
      this.logger.warn('register: Registration failed', { input });
      throw new HttpException('Registration failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    const { state, isSuccessful, userId, message, code } = result;
    const { email } = input;

    if (!isSuccessful) {
      const exception = RegistrationExceptionFactory.translate(message, state);
      throw exception;
    } else {
      // We already handled the registration fails in the advance method so we sure to return userId!, state!, code!
      return {
        id: userId!,
        email: email ?? null,
        phoneNumber: null,
        verificationState: state!,
        verificationCode: code!,
      };
    }
  }

  public async verifyRegistration(input: RegistrationDto): Promise<JwtResponseDto | null> {
    const { userId } = input;
    this.logger.debug(`verifyRegistration: Verifying user: ${userId}`);

    const result = await this.advanceRegistrationFlow(input, RegistrationStatus.EmailVerifying);

    if (!result) {
      this.logger.warn('verifyRegistration: Registration Verification failed', { input });
      throw new HttpException('Registration Verification failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const { state, isSuccessful, message } = result;

    if (!isSuccessful) {
      const exception = RegistrationExceptionFactory.translate(message, state);
      throw exception;
    } else {
      // providing JWT for 1h, if expired - client need to call '/login'
      return await this.authService.login(userId!, '1h');
    }
  }

  private async updateUserAndAdvance(
    verificationFlow: IVerificationFlow,
    user: ApplicationUser
  ): Promise<{ flowState: VerificationFlowState; user: ApplicationUser } | null> {
    if (verificationFlow.isComplete()) return null;

    const nextFlowState = verificationFlow.next();
    if (!nextFlowState) return null;

    const { state, requiresVerificationCode, isVerified } = nextFlowState;
    const verificationCode = requiresVerificationCode ? generateSecureCode(6) : undefined;
    const verificationCodeExpiresAt = requiresVerificationCode ? new Date(Date.now() + 1 * 60 * 60 * 1000) : undefined;

    const userPayload = verificationCode
      ? { id: user.id, verificationState: state, verificationCode, verificationCodeExpiresAt }
      : isVerified
        ? { id: user.id, verificationCode: null, verificationCodeExpiresAt: null, VerificationState: state }
        : { id: user.id, VerificationState: state };

    const userUpdated = await this.dataService.users.update(user.id, userPayload);

    if (!userUpdated) {
      throw new HttpException('Failed to update user verification status', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // TODO: update UserRegistration instead of User
    // // Manually update User values
    // user.verificationState = state;
    // user.verificationCode = verificationCode ?? null;
    // user.verificationCodeExpiresAt = verificationCodeExpiresAt ?? null;

    verificationFlow.sendNotification(user);

    return { flowState: nextFlowState, user };
  }

  private getVerificationFlow(): IVerificationFlow {
    if (!this.verificationFlow) {
      this.verificationFlow = VerificationFlowFactory.create(this.eventBus);
    }

    return this.verificationFlow;
  }

  private sendVerificationNotification(user: IApplicationUser, currentState: RegistrationStatus): void {
    const verificationFlow = this.getVerificationFlow();
    verificationFlow.setCurrentState(currentState);
    verificationFlow.sendNotification(user);
  }

  private async advanceRegistrationFlow(
    input: RegistrationDto,
    startFrom?: RegistrationStatus
  ): Promise<RegistrationTransitionResultDto | null> {
    const registrationFlow = RegistrationFactory.create(
      input.type,
      this.dataService,
      this.jwtService,
      this.config,
      this.eventBus
    );
    return registrationFlow.advance(input, startFrom);
  }
}
