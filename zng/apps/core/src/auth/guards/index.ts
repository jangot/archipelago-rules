import { JwtAuthGuard } from './jwt.guard';

export * from './jwt.guard';

export const CustomAuthGuards = [JwtAuthGuard];
