import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { ConfigurationVariableNotFoundException } from '@library/shared/common/exception/domain';
import { ILogoutUser } from '@library/shared/type';
import { IDomainServices } from '@core/modules/domain/idomain.services';
import { IJwtPayload } from '@core/modules/auth/interfaces/ijwt-payload';

@Injectable()
export class JwtLogoutStrategy extends PassportStrategy(Strategy, 'jwt-logout') {
  constructor(
    protected readonly domainServices: IDomainServices,
    protected readonly configService: ConfigService
  ) {
    const jwtSecret = configService.get<string>('JWT_ACCESS_SECRET');
    if (!jwtSecret) {
      throw new ConfigurationVariableNotFoundException('JWT_ACCESS_SECRET is not defined');
    }

    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: jwtSecret, passReqToCallback: true });
  }

  async validate(req: Request, payload: IJwtPayload): Promise<ILogoutUser> {
    const token = req.get('Authorization')?.replace('Bearer', '').trim();
    if (!token) {
      throw new UnauthorizedException('Access token not provided');
    }

    const userId = payload.sub;
    const userLogin = await this.domainServices.userServices.getUserLoginByToken(userId, token, false, true);

    if (!userLogin || !userLogin.sessionId) {
      throw new UnauthorizedException('JwtLogoutStrategy: Invalid access token');
    }

    // Return the payload (or a transformed user object) which will be attached to req.user.
    return { userId: userLogin.userId, sessionId: userLogin.sessionId };
  }
}
