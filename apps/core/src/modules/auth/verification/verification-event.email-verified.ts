import { IApplicationUser } from '@library/entity/entity-interface';
import { VerificationEventBase } from './verification-event.base';

export class VerificationEmailVerifiedEvent extends VerificationEventBase {
  constructor(user: IApplicationUser) {
    super(user);
  }
}
