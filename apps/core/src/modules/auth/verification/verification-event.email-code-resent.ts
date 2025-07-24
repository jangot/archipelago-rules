import { ApplicationUser } from '@library/shared/domain/entity';
import { ZirtueDistributedEvent } from '@library/shared/modules/event';
import { VerificationEventPayload } from './verification-event-payload';

export class VerificationEmailCodeResentEvent extends ZirtueDistributedEvent<VerificationEventPayload> {
  public static create(user: ApplicationUser): VerificationEmailCodeResentEvent {
    return new VerificationEmailCodeResentEvent(new VerificationEventPayload(user));
  }
}
