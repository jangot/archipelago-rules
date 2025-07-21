import { ApplicationUser } from '@library/shared/domain/entity';
import { VerificationEventBase } from './verification-event.base';

export class VerificationVerifiedEvent extends VerificationEventBase {
  constructor(user: ApplicationUser, name: string) {
    super(user, name);
  }
}
