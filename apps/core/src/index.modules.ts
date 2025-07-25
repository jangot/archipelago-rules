/*
 * File Name   : index.modules.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Feb 11 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { PaymentAccountsModule } from '@core/modules/payment-accounts/payment-accounts.module';
import { DynamicModule, ForwardReference, Type } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { DataModule } from './modules/data';
import { LendingModule } from './modules/lending/lending.module';
import { UsersModule } from './modules/users/users.module';


// Add Core specific modules to be Imported into the Core Module here
export const CoreModules: Array<Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference> =
    [DataModule, UsersModule, AuthModule, LendingModule, PaymentAccountsModule];
