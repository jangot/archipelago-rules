### User Registration States
```mermaid
---
config:
  title: User Registration States
  class:
    theme: base
---
%% Could not fully model the Email and PhoneNumber Verification Failure states as the layout
%% of the diagram doesn't flow properly when looping back here (hence the Notes)

stateDiagram-v2
  state email_success <<choice>>
  state phoneNumber_success <<choice>>

  NotRegistered --> EmailVerifying
  NotRegistered: <i class="fas fa-user-minus"></i> NotRegistered
  EmailVerifying: <i class="far fa-keyboard"></i> EmailVerifying
  state EmailVerifying {
      [*] --> SendEmail
      SendEmail: <i class="far fa-envelope"></i> Send Email
      SendEmail --> [*]
  }
  EmailVerifying --> email_success
  email_success --> EmailVerified
  EmailVerified: <i class="fas fa-check"></i> EmailVerified
  EmailVerified --> PhoneNumberVerifying
  email_success --> EmailVerificationFailed
  EmailVerificationFailed: <i class="fas fa-user-slash"></i> EmailVerificationFailed
  note right of EmailVerificationFailed: Requires User input
  note right of EmailVerificationFailed: Loops to EmailVerifying
  %% EmailVerificationFailed --> EmailVerifying

  PhoneNumberVerifying: <i class="far fa-keyboard"></i> PhoneNumberVerifying
  state PhoneNumberVerifying {
      [*] --> SendSMS
      SendSMS: <i class="far fa-comment"></i> Send SMS
      SendSMS --> [*]
  }
  PhoneNumberVerifying --> phoneNumber_success
  phoneNumber_success --> PhoneNumberVerified
  PhoneNumberVerified: <i class="fas fa-check"></i> PhoneNumberVerified
  PhoneNumberVerified --> Registered
  Registered: <i class="fas fa-user-shield"></i> Registered
  phoneNumber_success --> PhoneNumVerificationFailed %% (PhoneNumberVerificationFailed: real name had to abbreviate to fit)
  PhoneNumVerificationFailed: <i class="fas fa-user-slash"></i> PhoneNumVerificationFailed
  note right of PhoneNumVerificationFailed: Requires User input
  note right of PhoneNumVerificationFailed: Loops to PhoneNumVerifying
  %% PhoneNumberVerificationFailed --> PhoneNumVerifying

```