import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { IVerificationFlow } from './verification/iverification-flow.base';
import { IDataService } from '../data/idata.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';
import { UserRegisterResponseDto } from '../dto/response/user-register-response.dto';
import { generateSecureCode } from '@library/shared/common/helpers';
import { RegistrationStatus } from '@library/entity/enum/registration.status';
import { JwtResponseDto, RegistrationDto } from '../dto';
import { AuthService } from './auth.service';
import { DtoMapper } from '@library/entity/mapping/dto.mapper';
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
    private readonly eventBus: EventBus,
  ) {}

  public async register(input: RegistrationDto): Promise<UserRegisterResponseDto> {
    this.logger.debug(`register: Registering user`, { input });

    const registrationFlow = RegistrationFactory.create(
      input.type,
      this.dataService,
      this.jwtService,
      this.config,
      this.eventBus
    );

    const result = await registrationFlow.advance(input, RegistrationStatus.NotRegistered);
    if (!result) {
      this.logger.warn('register: Registration failed', { input });
      throw new HttpException('Registration failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    const { state, isSuccessful, userId, message, code } = result;
    const { email } = input;

    if (isSuccessful) {
      // We already handled the registration fails in the advance method so we sure to return userId!, state!, code!
      return {
        id: userId!,
        email: email ?? null,
        phoneNumber: null,
        verificationState: state!,
        verificationCode: code!,
      };
    } else {
      const exception = RegistrationExceptionFactory.translate(message, state);
      throw exception;
    }
  }

  public async verifyRegistration(
    id: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    verificationCode: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    verificationState: string
  ): Promise<JwtResponseDto | UserRegisterResponseDto | null> {
    this.logger.debug(`verify: Verifying user: ${id}`);

    const user = await this.dataService.users.getUserById(id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // TODO: Take this from UserRegistration
    // const {
    //   verificationCode: storedVerificationCode,
    //   verificationCodeExpiresAt,
    //   verificationState: storedVerificationState,
    // } = user;

    // TODO: Fix validation after UserRegistration inmplemented
    // // We are trying to verify the user and they don't have a verificationCode or verificationCodeExpiresAt value
    // if (!verificationCode || !verificationCodeExpiresAt) {
    //   throw new HttpException('No verification code exists for user', HttpStatus.BAD_REQUEST);
    // }

    // // Check if the verification code is valid and not expired
    // if (verificationCode !== storedVerificationCode || new Date() > verificationCodeExpiresAt) {
    //   throw new HttpException('Invalid or expired verification code', HttpStatus.BAD_REQUEST);
    // }

    // // Check if the verification state is valid
    // if (verificationState !== storedVerificationState) {
    //   throw new HttpException(`Invalid verification state: ${storedVerificationState}`, HttpStatus.BAD_REQUEST);
    // }

    let currentUser = user;
    const verificationFlow = this.getVerificationFlow();
    // TODO: Take this from UserRegistration
    //verificationFlow.setCurrentState(storedVerificationState);
    const updates = await this.updateUserAndAdvance(verificationFlow, user);
    const shouldReturnToken = updates?.flowState?.returnToken ?? false;
    currentUser = updates?.user ?? currentUser;

    if (shouldReturnToken) {
      return await this.authService.login(id);
    }

    if (updates) {
      const updatesPart2 = await this.updateUserAndAdvance(verificationFlow, updates.user);
      currentUser = updatesPart2?.user ?? currentUser;
      const shouldReturnToken = updatesPart2?.flowState?.returnToken ?? false;

      if (shouldReturnToken) {
        return await this.authService.login(id);
      }
    }

    return DtoMapper.toDto(currentUser, UserRegisterResponseDto);
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
}
