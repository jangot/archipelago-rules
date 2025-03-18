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

export * from './application.user.entity';
export * from './loan.entity';
export * from './login.entity';
export * from './user.registration.entity';

// Add all Core Entities here (will get add the TypeORM entities[])
// The glob pattern method does not seem to work properly, especially with WebPack
export const CoreEntities = [Loan, ApplicationUser, Login, UserRegistration];
