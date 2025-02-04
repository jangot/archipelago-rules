/*
 * File Name   : core.controller.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Feb 04 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { Controller, Get } from '@nestjs/common';
import { CoreService } from './core.service';

@Controller()
export class CoreController {
  constructor(private readonly coreService: CoreService) {}

  @Get()
  getHello(): string {
    return this.coreService.getHello();
  }
}
