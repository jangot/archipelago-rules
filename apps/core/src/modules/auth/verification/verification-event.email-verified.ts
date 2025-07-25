import { ApplicationUser } from '@library/shared/domain/entity';
import { ZirtueDistributedEvent } from '@library/shared/modules/event';
import { VerificationEventPayload } from './verification-event-payload';

export class VerificationEmailVerifiedEvent extends ZirtueDistributedEvent<VerificationEventPayload> {
  public static create(user: ApplicationUser): VerificationEmailVerifiedEvent {
    return new VerificationEmailVerifiedEvent(new VerificationEventPayload(user));
  }
}
