import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PasswordVerificationDto, UserResponseDto } from '../../dto';
import { ContactType } from '@library/entity/enum';

@Injectable()
export class PasswordStrategy extends PassportStrategy(Strategy, 'password') {
  constructor(private authService: AuthService) {
    super({ passReqToCallback: true });
  }

  async validate(req: Request): Promise<UserResponseDto> {
    const body = req.body;
    const validationBody: PasswordVerificationDto = {
      password: body!['password'],
      email: body!['email'],
      phoneNumber: body!['phoneNumber'],
    };
    const contactType = validationBody.email ? ContactType.EMAIL : ContactType.PHONE_NUMBER;
    const contact = validationBody.email || validationBody.phoneNumber || '';
    if (!contact || !validationBody.password) {
      throw new UnauthorizedException();
    }
    const user = await this.authService.validatePassword(contact, contactType, validationBody.password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
