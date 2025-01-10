# Zirtue Next Generation Platform: (ZiNG) Platform

## High Level Architecture
[Architecture](docs/high-level-architecture.md)

## Dependencies
- Node (starting version 22.13.0)
- NestJs (starting version 10.0.0)

## Structure
### Shared Library
Folder: `/zng/libs/shared`

Description: Shared code that is common to all of the following 3 services

### Core Service
Folder: `/zng/apps/core-api`

Description: Core Api functionality (Auth, Users, Organizations, Loans, Public endpoints for use by Mobile and Web Apps)

### Notifications Service
Folder: `/zng/apps/notification-api`

Description: Internal facing App used to schedule and fire `Notifications` to other systems (e.g. MailChimp, Twilio, Amplitude, etc.). May be exposed to external WebHook callbacks for Notification providers (e.g. Mailchimp and Twilio)

### Financial Payment Service
Folder: `/zng/apps/payment-api`

Description: Internal facing App used to manage Loan Funding, Disbursement, and Repayment. May be exposed to external WebHook callbacks for Payment providers.

