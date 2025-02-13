/*
 * File Name   : uuidparam.ts
 * Author      : Michael LeDuc
 * Created Date: Fri Feb 07 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { Param, ParseUUIDPipe } from '@nestjs/common';

export const UUIDParam = (name: string) => Param(name, new ParseUUIDPipe());
