import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserResponseDto } from '../dto';
import { IDataService } from '../data/idata.service';
import { compare } from 'bcryptjs';
import { AuthSecretType } from '@library/entity/interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  // Creating a Logger like this sets the Context, which will log the class name with the Log entries
  private readonly logger: Logger = new Logger(UsersService.name);

  constructor(
    private readonly dataService: IDataService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  public async validatePassword(contact: string, password: string): Promise<UserResponseDto | null> {
    this.logger.debug(`validatePassword: Validating password for contact: ${contact}`);

    const user = await this.usersService.getUserByContact(contact);
    if (!user) return user; // Returns null if user is not found

    // We validate password hash here
    const { id } = user;
    const authSecret = await this.dataService.authSecrets.findOneBy({ ownerId: id, type: AuthSecretType.PASSWORD });
    // No secret found
    if (!authSecret) return null;

    const { secret } = authSecret;
    const isPasswordValid = await compare(password, secret);
    if (!isPasswordValid) return null;

    return user;
  }

  public async login(user: UserResponseDto): Promise<unknown> {
    this.logger.debug(`login: Logging in user: ${user.id}`);

    // Generate JWT token
    const payload = { sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
