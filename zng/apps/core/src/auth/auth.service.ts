import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthSecretCreateRequestDto, JwtResponseDto, UserResponseDto } from '../dto';
import { IDataService } from '../data/idata.service';
import { compare, hash } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { AuthSecretType, ContactType, JwtType } from '@library/entity/enum';
import { AuthSecret } from '../data/entity';
import { EntityMapper } from '@library/entity/mapping/entity.mapper';
import { v4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  // Creating a Logger like this sets the Context, which will log the class name with the Log entries
  private readonly logger: Logger = new Logger(UsersService.name);

  constructor(
    private readonly dataService: IDataService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService
  ) {}

  public async validatePassword(
    contact: string,
    contactType: ContactType,
    password: string
  ): Promise<UserResponseDto | null> {
    this.logger.debug(`validatePassword: Validating password for ${contactType} contact: ${contact}`);

    const user = await this.usersService.getUserByContact(contact, contactType);
    if (!user) return user; // Returns null if user is not found

    // We validate password hash here
    const { id } = user;
    const authSecret = await this.dataService.authSecrets.getUserSecretByType(id, AuthSecretType.PASSWORD);
    // No secret found
    if (!authSecret) return null;

    const { secret } = authSecret;
    const isPasswordValid = await compare(password, secret);
    if (!isPasswordValid) return null;

    return user;
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

  // TODO: for sure should be refactored. Maybe to factory pattern
  public async linkPasswordSecret(userId: string, password: string): Promise<JwtResponseDto | null> {
    this.logger.debug(`linkPasswordSecret: Linking password secret for user: ${userId}`);

    const hashedPassword = await hash(password, 10);
    const createPayload: AuthSecretCreateRequestDto = {
      userId,
      type: AuthSecretType.PASSWORD,
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

  private async createAuthSecret(input: AuthSecretCreateRequestDto): Promise<AuthSecret | null> {
    this.logger.debug(`createAuthSecret: Creating AuthSecret ${input.type} for user: ${input.userId}`);

    const secret = EntityMapper.toEntity(input, AuthSecret);
    secret.id = v4();
    const result = await this.dataService.authSecrets.create(secret);
    return result;
  }
}
