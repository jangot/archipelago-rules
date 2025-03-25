import { LogoutAuthGuard } from './jwt-logout.guard';
import { RefreshTokenAuthGuard } from './jwt-refresh.guard';
import { JwtAuthGuard } from './jwt.guard';

export * from './jwt.guard';
export * from './jwt-refresh.guard';
export * from './jwt-logout.guard';

export const CustomAuthGuards = [JwtAuthGuard, RefreshTokenAuthGuard, LogoutAuthGuard];
