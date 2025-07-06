import { IApplicationUser } from '@library/entity/entity-interface';
import { VerificationEventBase } from './verification-event.base';

export class VerificationVerifiedEvent extends VerificationEventBase {
  constructor(user: IApplicationUser, name: string) {
    super(user, name);
  }
}
