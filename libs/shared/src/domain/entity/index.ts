/*
 * File Name   : index.ts
 * Author      : Michael LeDuc
 * Created Date: Thu Feb 06 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { ApplicationUser } from './application.user.entity';
import { BillerAddress } from './biller-address.entity';
import { Biller } from './biller.entity';
import { BillerMask } from './biller-mask.entity';
import { BillerName } from './biller-name.entity';
import { EventPublished } from './event.published.entity';
import { EventStore } from './event.store.entity';
import { EventSubscriber } from './event.subscriber.entity';
import { LoanApplication } from './loan-application.entity';
import { Loan } from './loan.entity';
import { LoanPayment } from './loan.payment.entity';
import { LoanPaymentHistory } from './loan.payment.history.entity';
import { LoanPaymentStep } from './loan.payment.step.entity';
import { Login } from './login.entity';
import { PaymentAccount } from './payment.account.entity';
import { PaymentsRoute } from './payments.route.entity';
import { PaymentsRouteStep } from './payments.route.step.entity';
import { Transfer } from './transfer.entity';
import { TransferError } from './transfer.error.entity';
import { UserRegistration } from './user.registration.entity';

export * from './application.user.entity';
export * from './biller-address.entity';
export * from './biller.entity';
export * from './biller-mask.entity';
export * from './biller-name.entity';
export * from './event.published.entity';
export * from './event.store.entity';
export * from './event.subscriber.entity';
export * from './loan-application.entity';
export * from './loan.entity';
export * from './loan.payment.entity';
export * from './loan.payment.history.entity';
export * from './loan.payment.step.entity';
export * from './login.entity';
export * from './payment.account.entity';
export * from './payments.route.entity';
export * from './payments.route.step.entity';
export * from './transfer.entity';
export * from './transfer.error.entity';
export * from './user.registration.entity';

// Add all Core Entities here (will get add the TypeORM entities[])
// The glob pattern method does not seem to work properly, especially with WebPack
export const EventEntities = [
  EventStore,
  EventSubscriber,
  EventPublished,
];

export const CoreEntities = [
  Loan,
  LoanApplication,
  ApplicationUser, 
  Login, 
  UserRegistration, 
  PaymentAccount,
];

// Add all Payment Entities here
export const PaymentEntities = [
  Transfer, 
  LoanPayment, 
  LoanPaymentStep,
  LoanPaymentHistory,
  PaymentsRouteStep,
  PaymentsRoute,
  TransferError,
  Biller,
  BillerName,
  BillerAddress,
  BillerMask,
];

export const AllEntities = [...CoreEntities, ...PaymentEntities];
