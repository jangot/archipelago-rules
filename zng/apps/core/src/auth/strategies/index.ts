import { JwtStrategy } from './jwt.strategy';
import { PasswordStrategy } from './password.strategy';

export * from './password.strategy';
export * from './jwt.strategy';

export const CustomAuthStrategies = [PasswordStrategy, JwtStrategy];
