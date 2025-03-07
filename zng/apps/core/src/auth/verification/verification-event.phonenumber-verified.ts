import { IApplicationUser } from '@library/entity/interface';
import { VerificationEventBase } from './verification-event.base';

export class VerificationPhoneNumberVerifiedEvent extends VerificationEventBase {
  constructor(user: IApplicationUser) {
    super(user);
  }
}
