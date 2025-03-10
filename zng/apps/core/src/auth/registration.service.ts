import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { IVerificationFlow } from './verification/iverification-flow.base';
import { IDataService } from '../data/idata.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';
import { UserRegisterResponseDto } from '../dto/response/user-register-response.dto';
import { ContactType } from '@library/entity/enum';
import { generateSecureCode } from '@library/shared/common/helpers';
import { transformPhoneNumber } from '@library/shared/common/data/transformers/phone-number.transformer';
import { RegistrationStatus } from '@library/entity/enum/verification.state';
import { JwtResponseDto } from '../dto';
import { AuthService } from './auth.service';
import { DtoMapper } from '@library/entity/mapping/dto.mapper';
import { ApplicationUser } from '../data/entity';
import { VerificationFlowState } from './verification/verification-flow.state';
import { VerificationFlowFactory } from './verification/verification-flow.factory';
import { IApplicationUser } from '@library/entity/interface';

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

  public async register(
    firstName: string,
    lastName: string,
    email?: string | null,
    phoneNumber?: string | null
  ): Promise<UserRegisterResponseDto> {
    this.logger.debug(`register: Registering user: ${email}`);

    const contactType = email ? ContactType.EMAIL : ContactType.PHONE_NUMBER;
    const contact = email || phoneNumber || null;
    if (!contact) {
      throw new HttpException('Either email or phone number must be provided', HttpStatus.BAD_REQUEST);
    }

    const existingUser = await this.dataService.users.getUserByContact(contact, contactType);
    if (existingUser) {
      throw new HttpException('User already exists', HttpStatus.CONFLICT);
    }

    const verificationCode = generateSecureCode(6); // Generate new Verification code
    const verificationCodeExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour expiration for now

    const newUser = {
      firstName,
      lastName,
      email: email ?? null,
      phoneNumber: transformPhoneNumber(phoneNumber ?? null),
      verificationCode,
      verificationCodeExpiresAt,
      verificationState: RegistrationStatus.EmailVerifying,
    };

    // Create the barebones User here
    const user = await this.dataService.users.create(newUser);

    // TODO: Add Notification call here
    // Email or Text: Send Notification
    this.sendVerificationNotification(user, user.registrationStatus);

    // Return the user id, email, and phonenumber (email or phonenumber will be null)
    // TODO: Remove verificationCode once we get Notifications working
    return {
      id: user.id,
      email: user.email ?? null,
      phoneNumber: user.phoneNumber ?? null,
      verificationState: newUser.verificationState,
      verificationCode,
    };
  }

  public async verify(
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
