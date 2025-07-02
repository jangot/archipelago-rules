import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigurationVariableNotFoundException } from '@library/shared/common/exception/domain';
import { IExpressRequestUser } from '@library/shared/type';
import { IDomainServices } from '@core/modules/domain/idomain.services';
import { IJwtPayload } from '@core/modules/auth/interfaces/ijwt-payload';

// Interface to avoid using 'any' as a type in 'validate' method
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly domainServices: IDomainServices,
    // Make it 'protected' not 'private' to be able to access it in the super() call
    protected readonly config: ConfigService
  ) {
    const jwtSecret = config.get<string>('JWT_ACCESS_SECRET');
    if (!jwtSecret) {
      throw new ConfigurationVariableNotFoundException('JWT_ACCESS_SECRET is not defined');
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
  async validate(payload: IJwtPayload): Promise<IExpressRequestUser> {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid JWT payload');
    }

    const id = payload.sub;
    const user = await this.domainServices.userServices.getUserById(id);
    // Possible fallback for case where token not expired but user not found (e.g. deleted)
    if (!user) {
      throw new UnauthorizedException();
    }

    return { id: user.id, firstName: user.firstName ?? undefined, lastName: user.lastName ?? undefined, email: user.email ?? undefined, 
      phoneNumber: user.phoneNumber ?? undefined, isAdmin: false };
  }
}
