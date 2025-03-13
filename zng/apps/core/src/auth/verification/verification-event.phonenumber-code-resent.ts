import { IApplicationUser } from '@library/entity/interface';
import { VerificationEventBase } from './verification-event.base';

export class VerificationPhoneNumberCodeResentEvent extends VerificationEventBase {
  constructor(user: IApplicationUser) {
    super(user);
  }
}
