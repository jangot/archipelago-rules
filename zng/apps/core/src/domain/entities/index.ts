/*
 * File Name   : index.ts
 * Author      : Michael LeDuc
 * Created Date: Thu Feb 06 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { ApplicationUser } from './application.user.entity';
import { Login } from './login.entity';
import { Loan } from './loan.entity';
import { UserRegistration } from './user.registration.entity';
import { Biller } from './biller.entity';
import { PaymentAccount } from './payment.account.entity';
import { Transfer } from './transfer.entity';
import { LoanPayment } from './loan.payment.entity';
import { LoanInvitee } from './loan.invitee.entity';
import { PaymentsRouteStep } from './payments.route.step.entity';
import { PaymentsRoute } from './payments.route.entity';

export * from './application.user.entity';
export * from './loan.entity';
export * from './login.entity';
export * from './user.registration.entity';
export * from './biller.entity';
export * from './payment.account.entity';
export * from './transfer.entity';
export * from './loan.payment.entity';
export * from './loan.invitee.entity';
export * from './payments.route.step.entity';
export * from './payments.route.entity';

// Add all Core Entities here (will get add the TypeORM entities[])
// The glob pattern method does not seem to work properly, especially with WebPack
export const CoreEntities = [
  Loan, 
  ApplicationUser, 
  Login, 
  UserRegistration, 
  Biller, 
  PaymentAccount, 
  Transfer, 
  LoanPayment, 
  LoanInvitee, 
  PaymentsRouteStep,
  PaymentsRoute,
];
