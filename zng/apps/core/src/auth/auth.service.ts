import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthSecretCreateRequestDto, JwtResponseDto, UserResponseDto } from '../dto';
import { IDataService } from '../data/idata.service';
import { compare, hash } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { LoginType, ContactType, JwtType } from '@library/entity/enum';
import { ApplicationUser, Login } from '../data/entity';
import { EntityMapper } from '@library/entity/mapping/entity.mapper';
import { v4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { generateSecureCode } from '@library/shared/common/helpers';
import { VerificationState } from '@library/entity/enum/verification.state';
import { UserRegisterResponseDto } from '../dto/response/user-register-response.dto';
import { transformPhoneNumber } from '@library/shared/common/data/transformers/phone-number.transformer';
import { DtoMapper } from '@library/entity/mapping/dto.mapper';
import { EventBus } from '@nestjs/cqrs';
import { IVerificationFlow } from './verification/iverification-flow.base';
import { VerificationFlowFactory } from './verification/verification-flow.factory';
import { IApplicationUser } from '@library/entity/interface';
import { VerificationFlowState } from './verification/verification-flow.state';

@Injectable()
export class AuthService {
  // Creating a Logger like this sets the Context, which will log the class name with the Log entries
  private readonly logger: Logger = new Logger(UsersService.name);
  private verificationFlow: IVerificationFlow | null = null;

  constructor(
    private readonly dataService: IDataService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly eventBus: EventBus
  ) {}

  public async validatePassword(
    contact: string,
    contactType: ContactType,
    password: string
  ): Promise<UserResponseDto | null> {
    this.logger.debug(`validatePassword: Validating password for ${contactType} contact: ${contact}`);

    const user = await this.getUserByContact(contact, contactType);
    if (!user) return user; // Returns null if user is not found

    // We validate password hash here
    const { id } = user;
    const authSecret = await this.dataService.logins.getUserSecretByType(id, LoginType.PASSWORD);
    // No secret found
    if (!authSecret) return null;

    const { secret } = authSecret;
    const isPasswordValid = await compare(password, secret!);
    if (!isPasswordValid) return null;

    return DtoMapper.toDto(user, UserResponseDto);
  }

  // feels like to much opened to the world
  public async login(id: string): Promise<JwtResponseDto> {
    this.logger.debug(`login: Logging in user: ${id}`);

    // Generate JWT token
    const payload = { sub: id };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

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

    const existingUser = await this.getUserByContact(contact, contactType);
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
      verificationState: VerificationState.VerifyingEmail,
    };

    // Create the barebones User here
    const user = await this.dataService.users.create(newUser);

    // TODO: Add Notification call here
    // Email or Text: Send Notification
    this.sendVerificationNotification(user, user.verificationState);

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
    verificationCode: string,
    verificationState: string
  ): Promise<JwtResponseDto | UserRegisterResponseDto | null> {
    this.logger.debug(`verify: Verifying user: ${id}`);

    const user = await this.dataService.users.findOneBy({ id });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const {
      verificationCode: storedVerificationCode,
      verificationCodeExpiresAt,
      verificationState: storedVerificationState,
    } = user;

    // We are trying to verify the user and they don't have a verificationCode or verificationCodeExpiresAt value
    if (!verificationCode || !verificationCodeExpiresAt) {
      throw new HttpException('No verification code exists for user', HttpStatus.BAD_REQUEST);
    }

    // Check if the verification code is valid and not expired
    if (verificationCode !== storedVerificationCode || new Date() > verificationCodeExpiresAt) {
      throw new HttpException('Invalid or expired verification code', HttpStatus.BAD_REQUEST);
    }

    // Check if the verification state is valid
    if (verificationState !== storedVerificationState) {
      throw new HttpException(`Invalid verification state: ${storedVerificationState}`, HttpStatus.BAD_REQUEST);
    }

    let currentUser = user;
    const verificationFlow = this.getVerificationFlow();
    verificationFlow.setCurrentState(storedVerificationState);
    const updates = await this.updateUserAndAdvance(verificationFlow, user);
    const shouldReturnToken = updates?.flowState?.returnToken ?? false;
    currentUser = updates?.user ?? currentUser;

    if (shouldReturnToken) {
      return await this.login(id);
    }

    if (updates) {
      const updatesPart2 = await this.updateUserAndAdvance(verificationFlow, updates.user);
      currentUser = updatesPart2?.user ?? currentUser;
      const shouldReturnToken = updatesPart2?.flowState?.returnToken ?? false;

      if (shouldReturnToken) {
        return await this.login(id);
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

    // Manually update User values
    user.verificationState = state;
    user.verificationCode = verificationCode ?? null;
    user.verificationCodeExpiresAt = verificationCodeExpiresAt ?? null;

    verificationFlow.sendNotification(user);

    return { flowState: nextFlowState, user };
  }

  // TODO: for sure should be refactored. Maybe to factory pattern
  public async linkPasswordSecret(userId: string, password: string): Promise<JwtResponseDto | null> {
    this.logger.debug(`linkPasswordSecret: Linking password secret for user: ${userId}`);

    const hashedPassword = await hash(password, 10);
    const createPayload: AuthSecretCreateRequestDto = {
      userId,
      type: LoginType.PASSWORD,
      secret: hashedPassword,
    };
    const secret = await this.createAuthSecret(createPayload);
    if (!secret) return null;

    return this.login(userId);
  }

  public async verifyJwtSignature(token: string, type: JwtType): Promise<boolean> {
    this.logger.debug(`verifyJwtSignature: Verifying JWT signature for token: ${token}`);

    let secretKey = 'JWT_SECRET';
    switch (type) {
      case JwtType.Registration:
        secretKey = 'JWT_REGISTRATION_SECRET';
        break;
      case JwtType.Login:
      default:
        break;
    }

    const secret = this.config.getOrThrow<string>(secretKey);

    try {
      this.jwtService.verify(token, { secret });
      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      this.logger.error(`verifyJwtSignature: Failed to verify JWT signature for token: ${token}`);
      return false;
    }
  }

  private async createAuthSecret(input: AuthSecretCreateRequestDto): Promise<Login | null> {
    this.logger.debug(`createAuthSecret: Creating AuthSecret ${input.type} for user: ${input.userId}`);

    const secret = EntityMapper.toEntity(input, Login);
    secret.id = v4();
    const result = await this.dataService.logins.create(secret);
    return result;
  }

  private async getUserByContact(contact: string, contactType: ContactType): Promise<ApplicationUser | null> {
    switch (contactType) {
      case ContactType.EMAIL:
        return await this.dataService.users.findOneBy({ email: contact });
      case ContactType.PHONE_NUMBER:
        return await this.dataService.users.findOneBy({ phoneNumber: contact });
      default:
        break;
    }

    return null;
  }

  private getVerificationFlow(): IVerificationFlow {
    if (!this.verificationFlow) {
      this.verificationFlow = VerificationFlowFactory.create(this.eventBus);
    }

    return this.verificationFlow;
  }

  private sendVerificationNotification(user: IApplicationUser, currentState: VerificationState): void {
    const verificationFlow = this.getVerificationFlow();
    verificationFlow.setCurrentState(currentState);
    verificationFlow.sendNotification(user);
  }
}
