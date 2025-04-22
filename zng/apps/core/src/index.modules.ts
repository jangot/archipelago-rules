/*
 * File Name   : index.modules.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Feb 11 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { DynamicModule, ForwardReference, Type } from '@nestjs/common';
import { DataModule } from './data';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LendingModule } from './lending/lending.module';

// Add Core specific modules to be Imported into the Core Module here
export const CoreModules: Array<Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference> = 
    [DataModule, UsersModule, AuthModule, LendingModule];
