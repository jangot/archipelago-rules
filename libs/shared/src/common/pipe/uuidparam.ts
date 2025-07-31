/*
 * File Name   : uuidparam.ts
 * Author      : Michael LeDuc
 * Created Date: Fri Feb 07 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { Param, ParseUUIDPipe, PipeTransform } from '@nestjs/common';
import { Type } from '@nestjs/common/interfaces';

export const UUIDParam = (name: string,  ...pipes: (Type<PipeTransform> | PipeTransform)[]) => Param(name, new ParseUUIDPipe(), ...pipes);
