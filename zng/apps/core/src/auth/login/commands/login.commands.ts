import { LoginExecuteParams } from './login.execute-params';

export class LoginCommand {
  constructor(public readonly payload: LoginExecuteParams) {}
}

export class LoginInitiateCommand extends LoginCommand {}
export class LoginVerifyCommand extends LoginCommand {}
export class LoginOnContactVerifiedCommand extends LoginCommand {}
export class LogoutCommand extends LoginCommand {}
