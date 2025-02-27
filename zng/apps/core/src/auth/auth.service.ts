import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserResponseDto } from '../dto';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  public async validatePassword(contact: string, password: string): Promise<UserResponseDto | null> {
    const user = await this.usersService.getUserByContact(contact);

    if (!user) return user; // Returns null if user is not found

    // TODO: We validate password hash here
    const isPasswordValid = password === 'password';
    if (!isPasswordValid) return null;

    return user;
  }
}
