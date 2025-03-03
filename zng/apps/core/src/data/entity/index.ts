/*
 * File Name   : index.ts
 * Author      : Michael LeDuc
 * Created Date: Thu Feb 06 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { ApplicationUser } from './application.user.entity';
import { AuthSecret } from './auth.secret.entity';
import { Loan } from './loan.entity';
import { Registration } from './registration.entity';

export * from './application.user.entity';
export * from './loan.entity';
export * from './auth.secret.entity';
export * from './registration.entity';

// Add all Core Entities here (will get add the TypeORM entities[])
// The glob pattern method does not seem to work properly, especially with WebPack
export const CoreEntities = [Loan, ApplicationUser, AuthSecret, Registration];
