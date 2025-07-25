import { ApplicationUser } from '@library/shared/domain/entity';
import { ZirtueDistributedEvent } from '@library/shared/modules/event';
import { VerificationEventPayload } from './verification-event-payload';

export class VerificationEmailVerifyingEvent extends ZirtueDistributedEvent<VerificationEventPayload> {
  public static create(user: ApplicationUser): VerificationEmailVerifyingEvent {
    return new VerificationEmailVerifyingEvent(new VerificationEventPayload(user));
  }
}
