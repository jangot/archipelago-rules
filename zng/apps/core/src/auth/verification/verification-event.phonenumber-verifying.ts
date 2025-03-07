import { IApplicationUser } from '@library/entity/interface';
import { VerificationEventBase } from './verification-event.base';

export class VerificationPhoneNumberVerifyingEvent extends VerificationEventBase {
  constructor(user: IApplicationUser) {
    super(user);
  }
}
