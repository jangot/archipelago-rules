import { ApplicationUser } from '@library/shared/domain/entity';
import { ZirtueDistributedEvent } from '@library/shared/modules/event';
import { VerificationEventPayload } from './verification-event-payload';

export class VerificationPhoneNumberCodeResentEvent extends ZirtueDistributedEvent<VerificationEventPayload> {
  public static create(user: ApplicationUser): VerificationPhoneNumberCodeResentEvent {
    return new VerificationPhoneNumberCodeResentEvent(new VerificationEventPayload(user));
  }
}
