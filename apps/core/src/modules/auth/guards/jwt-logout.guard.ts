import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LogoutAuthGuard extends AuthGuard('jwt-logout') {}
