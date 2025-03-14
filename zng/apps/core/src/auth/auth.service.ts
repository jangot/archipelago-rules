import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AuthSecretCreateRequestDto, JwtPayloadDto, LoginRequestDto, UserResponseDto } from '../dto';
import { IDataService } from '../data/idata.service';
import { compare, hash } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { LoginType, ContactType, JwtType } from '@library/entity/enum';
import { Login } from '../data/entity';
import { EntityMapper } from '@library/entity/mapping/entity.mapper';
import { v4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { DtoMapper } from '@library/entity/mapping/dto.mapper';
import { UserLoginPayloadDto } from '../dto/response/user-login-payload.dto';
import { IApplicationUser } from '@library/entity/interface';

@Injectable()
export class AuthService {
  // Creating a Logger like this sets the Context, which will log the class name with the Log entries
  private readonly logger: Logger = new Logger(AuthService.name);

  constructor(
    private readonly dataService: IDataService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService
  ) {}

  public async validatePassword(
    contact: string,
    contactType: ContactType,
    password: string
  ): Promise<UserResponseDto | null> {
    this.logger.debug(`validatePassword: Validating password for ${contactType} contact: ${contact}`);

    const user = await this.dataService.users.getUserByContact(contact, contactType);
    if (!user) return user; // Returns null if user is not found

    // We validate password hash here
    const { id } = user;
    const authSecret = await this.dataService.logins.getUserSecretByType(id, LoginType.Password);
    // No secret found
    if (!authSecret) return null;

    const { secret } = authSecret;
    const isPasswordValid = await compare(password, secret!);
    if (!isPasswordValid) return null;

    return DtoMapper.toDto(user, UserResponseDto);
  }

  public async login(loginInfo: LoginRequestDto, expiresIn?: string): Promise<UserLoginPayloadDto> {
    const contactInfo = this.extractContactInfo(loginInfo);
    const user = await this.dataService.users.getUserByContact(contactInfo.contact, contactInfo.contactType);

    return this.loginWithUser(user, expiresIn);
  }

  // feels like to much opened to the world
  public async loginById(id: string, expiresIn?: string): Promise<UserLoginPayloadDto> {
    this.logger.debug(`login: Logging in user: ${id}`);

    const user = await this.dataService.users.getUserById(id);
    return this.loginWithUser(user, expiresIn);
  }

  private async loginWithUser(user: IApplicationUser | null, expiresIn?: string): Promise<UserLoginPayloadDto> {
    if (!user) {
      throw new HttpException('U', HttpStatus.NOT_FOUND);
    }

    const result = this.generateLoginPayload(user.id, user.onboardStatus || '', expiresIn);

    return result;
  }

  public decodeToken(token: string): JwtPayloadDto | null {
    return this.jwtService.decode<JwtPayloadDto>(token) || null;
  }

  // TODO: for sure should be refactored. Maybe to factory pattern
  public async linkPasswordSecret(userId: string, password: string): Promise<UserLoginPayloadDto | null> {
    this.logger.debug(`linkPasswordSecret: Linking password secret for user: ${userId}`);

    const hashedPassword = await hash(password, 10);
    const createPayload: AuthSecretCreateRequestDto = {
      userId,
      type: LoginType.Password,
      secret: hashedPassword,
    };
    const secret = await this.createAuthSecret(createPayload);
    if (!secret) return null;

    return this.loginById(userId);
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
    const result = await this.dataService.logins.insert(secret, true);
    return result;
  }

  private generateLoginPayload(userId: string, onboardingStatus: string, expiresIn?: string): UserLoginPayloadDto {
    const exp = Math.floor((Date.now() + 3600000) / 1000); // 1 hour expiration in Unix Epoch time
    const iat = Math.floor(Date.now() / 1000); // Current dateTime in Unix Epoch time
    const payload: JwtPayloadDto = {
      iss: 'https://auth.zirtue.com',
      sub: userId,
      aud: 'api-zirtue.com',
      exp: exp,
      iat: iat,
      scope: 'read write profile',
      isAdmin: false,
    };

    // Default to 1 hour unless we override this
    if (!expiresIn) {
      expiresIn = '1h';
    }

    const accessToken =  this.jwtService.sign(payload, { expiresIn });

    const result: UserLoginPayloadDto = {
      userId,
      onboardingStatus,
      accessToken,
    };

    return result;
  }

  private extractContactInfo(loginInfo: LoginRequestDto): { contact: string; contactType: ContactType } {
    const email = (loginInfo.email || '').trim();
    const phoneNumber = (loginInfo.phoneNumber || '').trim();

    if (email && phoneNumber) {
      throw new Error('A valid email or phone number must be provided to login.');
    }

    if (email) {
      return { contact: email, contactType: ContactType.EMAIL };
    } else if (phoneNumber) {
      return { contact: phoneNumber, contactType: ContactType.PHONE_NUMBER };
    }

    throw new Error('A valid email or phone number must be provided to login.');
  }
}
