import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { ConfigurationVariableNotFoundException } from '@library/shared/common/exceptions/domain';
import { IRefreshTokenUser } from '@library/shared/types';
import { IDomainServices } from '@core/domain/idomain.services';
import { IRefreshTokenPayload } from '@core/domain/interfaces/irefresh-token-payload';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly domainServices: IDomainServices,
    private readonly configService: ConfigService
  ) {
    const jwtRefreshSecret = configService.get<string>('JWT_REFRESH_SECRET');
    if (!jwtRefreshSecret) {
      throw new ConfigurationVariableNotFoundException('JWT_REFRESH_SECRET is not defined');
    }

    super({
      // Expect the refresh token to be in the Authorization header as a Bearer token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Enforce expiration check (set to false only if you want to allow expired tokens for some reason)
      ignoreExpiration: false,
      // Use a separate secret for refresh tokens
      secretOrKey: jwtRefreshSecret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: IRefreshTokenPayload): Promise<IRefreshTokenUser> {
    const refreshToken = req.get('Authorization')?.replace('Bearer', '').trim();
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    const userId = payload.sub;
    const userLogin = await this.domainServices.userServices.getUserLoginByToken(userId, refreshToken);

    if (!userLogin || !userLogin.secret) {
      throw new UnauthorizedException('JwtRefreshStrategy: Invalid refresh token');
    }

    // Return the payload (or a transformed user object) which will be attached to req.user.
    return {
      userId: userLogin.userId,
      secret: userLogin.secret,
    };
  }
}
