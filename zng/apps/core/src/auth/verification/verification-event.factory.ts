// Import your event classes
import { VerificationEmailVerifyingEvent } from './verification-event.email-verifying';
import { VerificationEmailVerifiedEvent } from './verification-event.email-verified';
import { VerificationPhoneNumberVerifyingEvent } from './verification-event.phonenumber-verifying';
import { VerificationPhoneNumberVerifiedEvent } from './verification-event.phonenumber-verified';
import { VerificationVerifiedEvent } from './verification-event.verified';
import { IApplicationUser } from '@library/entity/interface';
import { VerificationEventBase } from './verification-event.base';

export enum VerificationEvents {
  VerificationEmailVerifyingEvent = 'VerificationEmailVerifyingEvent',
  VerificationEmailVerifiedEvent = 'VerificationEmailVerifiedEvent',
  VerificationPhoneNumberVerifyingEvent = 'VerificationPhoneNumberVerifyingEvent',
  VerificationPhoneNumberVerifiedEvent = 'VerificationPhoneNumberVerifiedEvent',
  VerificationVerifiedEvent = 'VerificationVerifiedEvent',
}

// Create a mapping from notification name to the class constructor.
// The type "new (user: IApplicationUser) => VerificationEventBase" indicates that each constructor takes an IApplicationUser parameter.
const eventMapping: Record<VerificationEvents, new (user: IApplicationUser) => VerificationEventBase> = {
  [VerificationEvents.VerificationEmailVerifyingEvent]: VerificationEmailVerifyingEvent,
  [VerificationEvents.VerificationEmailVerifiedEvent]: VerificationEmailVerifiedEvent,
  [VerificationEvents.VerificationPhoneNumberVerifyingEvent]: VerificationPhoneNumberVerifyingEvent,
  [VerificationEvents.VerificationPhoneNumberVerifiedEvent]: VerificationPhoneNumberVerifiedEvent,
  [VerificationEvents.VerificationVerifiedEvent]: VerificationVerifiedEvent,
};

export class VerificationEventFactory {
  public static create(user: IApplicationUser, notificationName: VerificationEvents): VerificationEventBase | null {
    if (!notificationName) return null;

    const EventClass = eventMapping[notificationName];
    if (!EventClass) {
      throw new Error(`No event registered for notification name "${notificationName}"`);
    }

    return new EventClass(user);
  }
}
