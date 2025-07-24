// Import your event classes
import { ApplicationUser } from '@library/shared/domain/entity';
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

export class VerificationEventFactory {
  public static create(user: ApplicationUser, notificationName: VerificationEvent): any | null {
    if (!notificationName) return null;

    // Use the static create method of each event class
    switch (notificationName) {
      case VerificationEvent.EmailVerifying:
        return VerificationEmailVerifyingEvent.create(user);
      case VerificationEvent.EmailVerified:
        return VerificationEmailVerifiedEvent.create(user);
      case VerificationEvent.PhoneNumberVerifying:
        return VerificationPhoneNumberVerifyingEvent.create(user);
      case VerificationEvent.PhoneNumberVerified:
        return VerificationPhoneNumberVerifiedEvent.create(user);
      case VerificationEvent.Verified:
        return VerificationVerifiedEvent.create(user);
      case VerificationEvent.EmailCodeResent:
        return VerificationEmailCodeResentEvent.create(user);
      case VerificationEvent.PhoneNumberCodeResent:
        return VerificationPhoneNumberCodeResentEvent.create(user);
      default:
        throw new Error(`No event registered for notification name "${notificationName}"`);
    }
  }
}
