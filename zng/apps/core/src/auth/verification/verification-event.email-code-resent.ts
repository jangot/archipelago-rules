import { IApplicationUser } from '@library/entity/interface';
import { VerificationEventBase } from './verification-event.base';

export class VerificationEmailCodeResentEvent extends VerificationEventBase {
  constructor(user: IApplicationUser) {
    super(user);
  }
}
