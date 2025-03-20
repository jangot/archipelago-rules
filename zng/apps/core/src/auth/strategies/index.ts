import { JwtRefreshStrategy } from './jwt-refresh.strategy';
import { JwtStrategy } from './jwt.strategy';

export * from './jwt.strategy';
export * from './jwt-refresh.strategy';

export const CustomAuthStrategies = [JwtStrategy, JwtRefreshStrategy];
