import { ApplicationUser } from '@library/shared/domain/entity';
import { ZirtueDistributedEvent } from '@library/shared/modules/event';
import { VerificationEventPayload } from './verification-event-payload';

export class VerificationPhoneNumberVerifiedEvent extends ZirtueDistributedEvent<VerificationEventPayload> {
  public static create(user: ApplicationUser): VerificationPhoneNumberVerifiedEvent {
    return new VerificationPhoneNumberVerifiedEvent(new VerificationEventPayload(user));
  }
}
