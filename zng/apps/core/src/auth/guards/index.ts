import { JwtAuthGuard } from './jwt.guard';
import { PasswordAuthGuard } from './password.guard';

export * from './password.guard';
export * from './jwt.guard';

export const CustomAuthGuards = [PasswordAuthGuard, JwtAuthGuard];
