import { LoginInitiateCommandHandler } from './login.initiate.command';
import { LoginOnContactVerifiedCommandHandler } from './login.on-contact-verified';
import { RefreshTokenCommandHandler } from './login.refreshTokens.command';
import { LoginVerifyCommandHandler } from './login.verify.command';
import { LogoutCommandHandler } from './logout.command';

export const LoginCommandHandlers = [
  LoginInitiateCommandHandler,
  LoginVerifyCommandHandler,
  LogoutCommandHandler,
  RefreshTokenCommandHandler,
  LoginOnContactVerifiedCommandHandler,
];

export * from './login.commands';
