import { IApplicationUser } from '@library/entity/entity-interface';
import { VerificationEventBase } from './verification-event.base';

export class VerificationPhoneNumberVerifiedEvent extends VerificationEventBase {
  constructor(user: IApplicationUser, name: string) {
    super(user, name);
  }
}
