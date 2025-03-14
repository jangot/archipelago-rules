import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserResponseDto } from '../../dto';
import { Injectable, UnauthorizedException } from '@nestjs/common';

// Interface to avoid using 'any' as a type in 'validate' method
interface IJwtPayload {
  sub: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly usersService: UsersService,
    // Make it 'protected' not 'private' to be able to access it in the super() call
    protected readonly config: ConfigService
  ) {
    const jwtSecret = config.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
      ignoreExpiration: false, // TODO: Should we make it dynamic for testing purposes?
    });
  }

  // Need to consider caching scenarios here, as performing a DB lookup on every request
  // will incur performance costs
  // Also, do we need to store the entire User Entity here?
  async validate(payload: IJwtPayload): Promise<UserResponseDto> {
    const id = payload.sub;
    const user = await this.usersService.getUserById(id);
    // Possible fallback for case where token not expired but user not found (e.g. deleted)
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
