import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserResponseDto } from '../../dto';

@Injectable()
export class PasswordStrategy extends PassportStrategy(Strategy, 'password') {
  constructor(private authService: AuthService) {
    super({
      // Renaming 'username' to 'contact' to highlight that it can be either an email or a phone number
      usernameField: 'contact',
    });
  }

  async validate(contact: string, password: string): Promise<UserResponseDto> {
    const user = await this.authService.validatePassword(contact, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
