import { RefreshTokenAuthGuard } from './jwt-refresh.guard';
import { JwtAuthGuard } from './jwt.guard';

export * from './jwt.guard';
export * from './jwt-refresh.guard';

export const CustomAuthGuards = [JwtAuthGuard, RefreshTokenAuthGuard];
