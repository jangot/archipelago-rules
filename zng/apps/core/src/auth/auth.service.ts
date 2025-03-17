import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtPayloadDto, LoginVerifyRequestDto, UserResponseDto } from '../dto';
import { IDataService } from '../data/idata.service';
import { compare } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { LoginType, ContactType } from '@library/entity/enum';
import { DtoMapper } from '@library/entity/mapping/dto.mapper';
import { UserLoginPayloadDto } from '../dto/response/user-login-payload.dto';
import { IApplicationUser } from '@library/entity/interface';
import { LoginRequestDto } from '../dto/request/login.request.dto';
import { CommandBus } from '@nestjs/cqrs';
import { LoginInitiateCommand, LoginVerifyCommand } from './login/commands';

@Injectable()
export class AuthService {
  // Creating a Logger like this sets the Context, which will log the class name with the Log entries
  private readonly logger: Logger = new Logger(AuthService.name);

  constructor(
    private readonly dataService: IDataService,
    private readonly jwtService: JwtService,
    private readonly commandBus: CommandBus
  ) {}

  public async initiateLoginSession(request: LoginRequestDto): Promise<UserLoginPayloadDto> {
    const contactInfo = this.extractContactInfo(request);

    return await this.commandBus.execute(
      new LoginInitiateCommand({ contact: contactInfo.contact, contactType: contactInfo.contactType })
    );
  }

  public async verifyLoginSession(request: LoginVerifyRequestDto): Promise<UserLoginPayloadDto> {
    const contactInfo = this.extractContactInfo(request);

    return await this.commandBus.execute(
      new LoginVerifyCommand({
        contact: contactInfo.contact,
        contactType: contactInfo.contactType,
        verificationCode: request.code,
      })
    );
  }

  public async logout(userId: string): Promise<void> {
    this.logger.debug(`logout: Logging out user: ${userId}`);
    // Invalidate the JWT token by removing it from the database or marking it as invalid
    // This is a placeholder for the actual implementation
    // await this.dataService.logins.invalidateToken(userId);
    this.logger.log(`User ${userId} logged out successfully`);
  }

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

  private generateLoginPayload(userId: string, onboardingStatus: string, expiresIn?: string): UserLoginPayloadDto {
    //const exp = Math.floor((Date.now() + 3600000) / 1000); // 1 hour expiration in Unix Epoch time
    const iat = Math.floor(Date.now() / 1000); // Current dateTime in Unix Epoch time
    const payload: JwtPayloadDto = {
      iss: 'https://auth.zirtue.com',
      sub: userId,
      aud: 'api-zirtue.com',
      //exp: exp,
      iat: iat,
      scope: 'read write profile',
      isAdmin: false,
    };

    // Default to 1 hour unless we override this
    if (!expiresIn) {
      expiresIn = '1h';
    }

    const accessToken = this.jwtService.sign(payload, { expiresIn });

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
