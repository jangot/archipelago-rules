import { ApplicationUser } from '@library/shared/domain/entity';
import { ZirtueDistributedEvent } from '@library/shared/modules/event';
import { VerificationEventPayload } from './verification-event-payload';

export class VerificationPhoneNumberVerifyingEvent extends ZirtueDistributedEvent<VerificationEventPayload> {
  public static create(user: ApplicationUser): VerificationPhoneNumberVerifyingEvent {
    return new VerificationPhoneNumberVerifyingEvent(new VerificationEventPayload(user));
  }
}
