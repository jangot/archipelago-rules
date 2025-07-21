// Import your event classes
import { ApplicationUser } from '@library/shared/domain/entity';
import { VerificationEventBase } from './verification-event.base';
import { VerificationEmailCodeResentEvent } from './verification-event.email-code-resent';
import { VerificationEmailVerifiedEvent } from './verification-event.email-verified';
import { VerificationEmailVerifyingEvent } from './verification-event.email-verifying';
import { VerificationPhoneNumberCodeResentEvent } from './verification-event.phonenumber-code-resent';
import { VerificationPhoneNumberVerifiedEvent } from './verification-event.phonenumber-verified';
import { VerificationPhoneNumberVerifyingEvent } from './verification-event.phonenumber-verifying';
import { VerificationVerifiedEvent } from './verification-event.verified';

export enum VerificationEvent {
  EmailVerifying = 'VerificationEmailVerifyingEvent',
  EmailVerified = 'VerificationEmailVerifiedEvent',
  PhoneNumberVerifying = 'VerificationPhoneNumberVerifyingEvent',
  PhoneNumberVerified = 'VerificationPhoneNumberVerifiedEvent',
  Verified = 'VerificationVerifiedEvent',
  EmailCodeResent = 'VerificationEmailCodeResentEvent',
  PhoneNumberCodeResent = 'VerificationPhoneNumberCodeResentEvent',
}

// Create a mapping from notification name to the class constructor.
// The type "new (user: IApplicationUser) => VerificationEventBase" indicates that each constructor takes an IApplicationUser parameter.
const eventMapping: Record<VerificationEvent, new (user: ApplicationUser, name: string) => VerificationEventBase> = {
  [VerificationEvent.EmailVerifying]: VerificationEmailVerifyingEvent,
  [VerificationEvent.EmailVerified]: VerificationEmailVerifiedEvent,
  [VerificationEvent.PhoneNumberVerifying]: VerificationPhoneNumberVerifyingEvent,
  [VerificationEvent.PhoneNumberVerified]: VerificationPhoneNumberVerifiedEvent,
  [VerificationEvent.Verified]: VerificationVerifiedEvent,
  [VerificationEvent.EmailCodeResent]: VerificationEmailCodeResentEvent,
  [VerificationEvent.PhoneNumberCodeResent]: VerificationPhoneNumberCodeResentEvent,
};

export class VerificationEventFactory {
  public static create(user: ApplicationUser, notificationName: VerificationEvent): VerificationEventBase | null {
    if (!notificationName) return null;

    const EventClass = eventMapping[notificationName];
    if (!EventClass) {
      throw new Error(`No event registered for notification name "${notificationName}"`);
    }

    const event = new EventClass(user, notificationName);
    return event;
  }
}
