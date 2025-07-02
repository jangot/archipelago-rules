import { IApplicationUser } from '@library/entity/entity-interface';
import { VerificationEventBase } from './verification-event.base';

export class VerificationEmailVerifyingEvent extends VerificationEventBase {
  constructor(user: IApplicationUser) {
    super(user);
  }
}
